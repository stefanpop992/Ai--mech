"""HTTP regression coverage for password validation and session revocation."""
import os
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

os.environ['DATABASE_URL'] = 'sqlite://'
os.environ['GEMINI_API_KEY'] = 'test-only'
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from app.db import model_import
from app.db.models.chat_message import ChatMessage
from app.db.base import Base
from app.db.session import get_db
from app.db.models.user import User
from app.db.models.session import Session as DBSession
from app.api.v1.endpoints import auth, password
from app.core.security import hash_password, verify_password


class PasswordRecoveryTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        now = datetime.now(timezone.utc)
        self.user = User(email='owner@example.com', hashed_password=hash_password('old-password'),
            is_verified=True, reset_token='reset-token', reset_token_expires=now + timedelta(minutes=30))
        self.other = User(email='other@example.com', hashed_password=hash_password('other-password'))
        self.db.add_all([self.user, self.other])
        self.db.flush()
        for token, user in [('current', self.user), ('second', self.user), ('unrelated', self.other)]:
            self.db.add(DBSession(user_id=user.id, token=token, expires_at=now + timedelta(days=1)))
        self.db.commit()
        app = FastAPI()
        app.include_router(auth.router)
        app.include_router(password.router)
        app.dependency_overrides[get_db] = lambda: self.db
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        self.db.close()
        self.engine.dispose()

    def test_reset_revokes_all_owners_sessions_and_token_is_single_use(self):
        response = self.client.post('/auth/reset-password', json={'token': 'reset-token', 'new_password': 'new-password'})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertIn('Max-Age=0', response.headers['set-cookie'])
        self.assertEqual(self.db.query(DBSession).filter_by(user_id=self.user.id).count(), 0)
        self.assertEqual(self.db.query(DBSession).filter_by(user_id=self.other.id).count(), 1)
        self.assertTrue(verify_password('new-password', self.user.hashed_password))
        self.assertFalse(verify_password('old-password', self.user.hashed_password))
        self.assertIsNone(self.user.reset_token)
        self.assertEqual(self.client.post('/auth/reset-password', json={'token': 'reset-token', 'new_password': 'another-password'}).status_code, 400)
        self.client.cookies.set('access_token', 'second')
        self.assertEqual(self.client.get('/auth/me').status_code, 401)

    def test_invalid_expired_and_missing_expiry_do_not_change_credentials(self):
        old_hash = self.user.hashed_password
        for token, expiry in [('wrong-token', datetime.now(timezone.utc)), ('reset-token', datetime.now(timezone.utc) - timedelta(minutes=1)), ('reset-token', None)]:
            with self.subTest(token=token, expiry=expiry):
                self.user.reset_token_expires = expiry
                self.db.commit()
                result = self.client.post('/auth/reset-password', json={'token': token, 'new_password': 'new-password'})
                self.assertEqual(result.status_code, 400)
                self.assertEqual(self.user.hashed_password, old_hash)
                self.assertEqual(self.db.query(DBSession).count(), 3)

    def test_both_change_methods_revoke_other_sessions_and_pending_reset(self):
        self.client.cookies.set('access_token', 'current')
        for method, current, new in [('PUT', 'old-password', 'changed-once'), ('POST', 'changed-once', 'changed-twice')]:
            with self.subTest(method=method):
                result = self.client.request(method, '/auth/change-password', json={'current_password': current, 'new_password': new})
                self.assertEqual(result.status_code, 200, result.text)
                self.assertTrue(verify_password(new, self.user.hashed_password))
                self.assertIsNone(self.user.reset_token)
                self.assertEqual({s.token for s in self.db.query(DBSession).all()}, {'current', 'unrelated'})
                self.assertEqual(self.client.get('/auth/me').status_code, 200)

    def test_wrong_current_password_leaves_sessions_and_reset_intact(self):
        self.client.cookies.set('access_token', 'current')
        result = self.client.put('/auth/change-password', json={'current_password': 'incorrect', 'new_password': 'new-password'})
        self.assertEqual(result.status_code, 400)
        self.assertEqual(self.db.query(DBSession).count(), 3)
        self.assertEqual(self.user.reset_token, 'reset-token')

    def test_every_password_creation_route_rejects_short_and_overlong_passwords(self):
        self.client.cookies.set('access_token', 'current')
        for value in ['', 'short', 'a' * 73, 'å' * 37]:
            for method, path, body in [
                ('POST', '/auth/register', {'email': 'new@example.com', 'password': value}),
                ('POST', '/auth/reset-password', {'token': 'reset-token', 'new_password': value}),
                ('PUT', '/auth/change-password', {'current_password': 'old-password', 'new_password': value}),
                ('POST', '/auth/change-password', {'current_password': 'old-password', 'new_password': value}),
            ]:
                with self.subTest(path=path, method=method, value=value):
                    self.assertEqual(self.client.request(method, path, json=body).status_code, 422)
        self.assertEqual(self.db.query(DBSession).count(), 3)
        self.assertEqual(self.user.reset_token, 'reset-token')

    def test_password_utf8_boundary(self):
        value = 'å' * 36
        self.assertTrue(verify_password(value, hash_password(value)))
        with self.assertRaises(ValueError):
            hash_password(value + 'a')

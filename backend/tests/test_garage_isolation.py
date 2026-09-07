"""Run with: python -m unittest discover -s backend/tests"""
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

os.environ['DATABASE_URL'] = 'sqlite://'
os.environ['GEMINI_API_KEY'] = 'test-only'
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import HTTPException, Response
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session
from app.db import model_import
from app.db.base import Base
from app.db.models.user import User
from app.db.models.car import Car
from app.db.models.garage import Garage
from app.db.models.garage_car import GarageCar
from app.db.models.chat_message import ChatMessage
from app.db.models.part import Part
from app.db.models.car_document import CarDocument
from app.api.v1.endpoints import cars, users
from app.schemas.car import CarUpdate
from app.services.garage_service import verify_car_in_garage


class GarageIsolationTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine('sqlite://')
        event.listen(self.engine, 'connect', lambda conn, _: conn.execute('PRAGMA foreign_keys=ON'))
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine, autoflush=False)
        self.a = User(email='a@example.com', hashed_password='test')
        self.b = User(email='b@example.com', hashed_password='test')
        self.car = Car(regnr='ABC123', make='Volvo', model='V60')
        self.a.garage = Garage(name='A')
        self.b.garage = Garage(name='B')
        self.db.add_all([self.a, self.b, self.car])
        self.db.flush()
        self.db.add_all([GarageCar(garage_id=u.garage.id, car_id=self.car.id) for u in (self.a, self.b)])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_personal_edits_do_not_change_other_users_or_shared_row(self):
        result = cars.update_car(self.car.id, CarUpdate(make='Personal', engine=None), self.db, self.a)
        self.assertEqual(result.make, 'Personal')
        self.assertEqual(self.db.get(Car, self.car.id).make, 'Volvo')
        self.assertEqual(cars.list_my_cars(self.db, self.a)[0].make, 'Personal')
        self.assertEqual(cars.get_car_detail(self.car.id, self.db, self.a).make, 'Personal')
        self.assertEqual(verify_car_in_garage(self.db, self.a, self.car.id).make, 'Personal')
        self.assertEqual(cars.list_my_cars(self.db, self.b)[0].make, 'Volvo')
        cars.update_car(self.car.id, CarUpdate(year=2020), self.db, self.a)
        self.assertEqual(cars.list_my_cars(self.db, self.a)[0].make, 'Personal')

    def test_non_member_cannot_edit(self):
        outsider = User(email='c@example.com', hashed_password='test')
        self.db.add(outsider)
        self.db.commit()
        with self.assertRaises(HTTPException) as error:
            cars.update_car(self.car.id, CarUpdate(make='Changed'), self.db, outsider)
        self.assertEqual(error.exception.status_code, 404)

    def test_account_deletion_preserves_shared_car_and_other_users_data(self):
        a_id, b_id, car_id = self.a.id, self.b.id, self.car.id
        private_car = Car(regnr='XYZ789')
        self.db.add(private_car)
        self.db.flush()
        private_id = private_car.id
        self.db.add(GarageCar(garage_id=self.a.garage.id, car_id=private_id))
        self.db.add_all([ChatMessage(user_id=u.id, car_id=car_id, role='user', content='test') for u in (self.a, self.b)])
        for user in (self.a, self.b):
            self.db.add(Part(user_id=user.id, car_id=car_id, name='Filter', category='engine'))
            self.db.add(CarDocument(user_id=user.id, car_id=car_id, category='kvitton',
                filename='receipt.txt', stored_path='unused', file_size=7, mime_type='text/plain'))
        self.db.commit()
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for uid in (a_id, b_id):
                (root / str(uid)).mkdir()
                (root / str(uid) / 'receipt.txt').write_text('receipt')
            with patch.object(users, 'UPLOAD_DIR', root), patch.object(users, 'PROFILES_DIR', root / 'profiles'):
                users.delete_account(None, Response(), self.db, self.a)
            self.assertFalse((root / str(a_id)).exists())
            self.assertTrue((root / str(b_id) / 'receipt.txt').exists())
        self.db.expunge_all()
        self.assertIsNone(self.db.get(User, a_id))
        self.assertIsNotNone(self.db.get(Car, car_id))
        self.assertIsNone(self.db.get(Car, private_id))
        self.assertEqual(self.db.query(GarageCar).filter_by(car_id=car_id).count(), 1)
        self.assertEqual(self.db.query(ChatMessage).filter_by(user_id=b_id).count(), 1)
        self.assertEqual(self.db.query(ChatMessage).filter_by(user_id=a_id).count(), 0)
        for model in (Part, CarDocument):
            self.assertEqual(self.db.query(model).filter_by(user_id=b_id).count(), 1)
            self.assertEqual(self.db.query(model).filter_by(user_id=a_id).count(), 0)


if __name__ == '__main__':
    unittest.main()

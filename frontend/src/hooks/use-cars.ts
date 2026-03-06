import useSWR, { mutate } from 'swr';
import { fetcher, addCarByRegnr, addCarManual, deleteCar, type Car } from '@/lib/api-client';

const CARS_KEY = '/cars';

export function useCars() {
  const { data, error, isLoading } = useSWR<Car[]>(CARS_KEY, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    cars: data ?? [],
    isLoading,
    isError: !!error,
    error,
  };
}

export async function revalidateCars() {
  await mutate(CARS_KEY);
}

export async function createCarByRegnr(regnr: string) {
  await addCarByRegnr(regnr);
  await revalidateCars();
}

export async function createCarManual(data: Parameters<typeof addCarManual>[0]) {
  await addCarManual(data);
  await revalidateCars();
}

export async function removeCar(carId: number) {
  await deleteCar(carId);
  await revalidateCars();
}

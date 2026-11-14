import { pointsFor, starsFor } from './scoring';

test('stars by accuracy', () =>
  expect([starsFor(4, 8), starsFor(5, 8), starsFor(7, 8), starsFor(8, 8), starsFor(0, 0)]).toEqual([0, 1, 2, 3, 0]));
test('stars at exact thresholds', () =>
  expect([starsFor(60, 100), starsFor(80, 100), starsFor(95, 100), starsFor(59, 100)]).toEqual([1, 2, 3, 0]));
test('points by attempt', () => expect([pointsFor(1), pointsFor(2), pointsFor(3)]).toEqual([10, 5, 0]));

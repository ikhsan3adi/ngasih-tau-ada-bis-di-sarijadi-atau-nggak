import { describe, expect, it } from 'bun:test'
import { enrichRoute, extractRoute, inferRouteFromPlate } from './routes'

describe('Routes Domain Module', () => {
  describe('extractRoute', () => {
    it('should extract correct route label from vehicleNo/title', () => {
      expect(extractRoute('D 7899 AS - KORIDOR 2')).toBe('KORIDOR 2')
      expect(extractRoute('FEEDER 1 - D 7694 AQ')).toBe('FEEDER 1')
      expect(extractRoute('BS KORIDOR 3 - Cibiru')).toBe('BS KORIDOR 3')
      expect(extractRoute('BANDROS')).toBe('BANDROS')
      expect(extractRoute('UNKNOWN VEHICLE')).toBeNull()
    })
  })

  describe('inferRouteFromPlate', () => {
    it('should infer route from plate number', () => {
      expect(inferRouteFromPlate('D 7899 AS')).toBe('KORIDOR 2')
      expect(inferRouteFromPlate('D 7906 AS')).toBe('KORIDOR 4')
      expect(inferRouteFromPlate('D 1111 AA')).toBeNull()
      expect(inferRouteFromPlate(null)).toBeNull()
    })
  })

  describe('enrichRoute', () => {
    it('should enrich known routes with their jurusan', () => {
      expect(enrichRoute('KORIDOR 2')).toBe('KORIDOR 2 | Cicaheum - Cibeureum')
      expect(enrichRoute('FEEDER 1')).toBe(
        'FEEDER 1 | Stasiun Hall - Gunung Batu',
      )
      expect(enrichRoute('BANDROS')).toBe('BANDROS') // not in map, return original
      expect(enrichRoute(null)).toBe('Unknown Route')
    })
  })
})

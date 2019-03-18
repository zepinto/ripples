import { interpolateTwoPoints, getPrevAndNextPoints } from './PositionUtils'
import IPositionAtTime from '../model/IPositionAtTime';

describe("interpolate two points", () => {
    it("finds the correct lat and lng using linear interpolation", () => {
        const point1 = {latitude: 0, longitude: 0, timestamp: 0}
        const point2 = {latitude: 10, longitude: 10, timestamp: 10000}
        const date = 5000
        const result = interpolateTwoPoints(date, point1, point2)
        expect(result.latitude).toEqual(5)
        expect(result.longitude).toEqual(5)
    });

    it("returns the date given", () => {
        const point1 = {latitude:0, longitude: 0, timestamp: 0}
        const point2 = {latitude: 10, longitude: 10, timestamp: 10000}
        const date = 5000
        expect(interpolateTwoPoints(date, point1, point2).timestamp).toEqual(date)
    })

    it("finds the correct heading 0", () => {
        const point1 = {latitude: 0, longitude: 0, timestamp: 0}
        const point2 = {latitude: 10, longitude: 0, timestamp: 10000}
        const date = 5000
        const result = interpolateTwoPoints(date, point1, point2)
        expect(result.heading).toEqual(0)
    });

    it("finds the correct heading 90", () => {
        const point1 = {latitude: 0, longitude: 0, timestamp: 0}
        const point2 = {latitude: 0, longitude: 10, timestamp: 10000}
        const date = 5000
        const result = interpolateTwoPoints(date, point1, point2)
        expect(result.heading).toEqual(90)
    });

    it("finds the correct heading 180", () => {
        const point1 = {latitude: 0, longitude: 0, timestamp: 0}
        const point2 = {latitude: -10, longitude: 0, timestamp: 10000}
        const date = 5000
        const result = interpolateTwoPoints(date, point1, point2)
        expect(result.heading).toEqual(180)
    });

    it("finds the correct heading 270", () => {
        const point1 = {latitude: 0, longitude: 0, timestamp: 0}
        const point2 = {latitude: 0, longitude: -10, timestamp: 10000}
        const date = 5000
        const result = interpolateTwoPoints(date, point1, point2)
        expect(result.heading).toEqual(270)
    });

    it("finds the correct heading 315", () => {
        const point1 = {latitude: 0, longitude: 0, timestamp: 0}
        const point2 = {latitude: 10, longitude: -10, timestamp: 10000}
        const date = 5000
        const result = interpolateTwoPoints(date, point1, point2)
        expect(result.heading).toEqual(315)
    });

    it("finds the correct heading NW", () => {
        const point1 = {latitude: 41.18197, longitude: -8.70558, timestamp: 0}
        const point2 = {latitude: 41.18278, longitude: -8.70571, timestamp: 10000}
        const date = 5000
        const result = interpolateTwoPoints(date, point1, point2)
        expect(result.heading).toBeGreaterThan(270)
        expect(result.heading).toBeLessThan(360)
    })

    it("finds the correct lat and lng for two equal points", () => {
        const point = {latitude: 0, longitude: 0, timestamp: 0}
        const date = 5000
        let result = interpolateTwoPoints(date, point, point)
        expect(result.latitude).toEqual(0)
        expect(result.longitude).toEqual(0)
    })

});

describe("get prev and next points", () => {
    it("handles empty array", () => {
        const points: IPositionAtTime[] = []
        let result = getPrevAndNextPoints(points, Date.now())
        expect(result.prev.latitude).not.toBeUndefined()
        expect(result.prev.longitude).not.toBeUndefined()
        expect(result.prev.timestamp).not.toBeUndefined()
        expect(result.next.latitude).not.toBeUndefined()
        expect(result.next.longitude).not.toBeUndefined()
        expect(result.next.timestamp).not.toBeUndefined()
    })
    it("handles array with 1 element", () => {
        const points: IPositionAtTime[] = [{latitude: 0, longitude: 0, timestamp: 0}]
        let result = getPrevAndNextPoints(points, Date.now())
        expect(result.prev.latitude).toBe(0)
        expect(result.prev.longitude).toBe(0)
        expect(result.prev.timestamp).toBe(0)
        expect(result.prev).toEqual(result.next)
    })
    it("handles date inferior to plan timestamp", () => {
        let firstTimestamp = 1000
        const points: IPositionAtTime[] = [{latitude: 0, longitude: 0, timestamp: 1000}, {latitude: 10, longitude: 10, timestamp: 2000}]
        let result = getPrevAndNextPoints(points, 0)
        expect(result.prev.latitude).toBe(0)
        expect(result.prev.longitude).toBe(0)
        expect(result.prev.timestamp).toBe(firstTimestamp)
        expect(result.prev).toEqual(result.next)
    })
    it("handles date superior to plan timestamp", () => {
        let lastTimestamp = 2000
        const points: IPositionAtTime[] = [{latitude: 0, longitude: 0, timestamp: 1000}, {latitude: 10, longitude: 10, timestamp: lastTimestamp}]
        let result = getPrevAndNextPoints(points, 3000)
        expect(result.prev.latitude).toBe(10)
        expect(result.prev.longitude).toBe(10)
        expect(result.prev.timestamp).toBe(lastTimestamp)
        expect(result.prev).toEqual(result.next)
    })
    it("handles normal use case", () => {
        const p1 = {latitude: 0, longitude: 0, timestamp: 1000}
        const p2 = {latitude: 10, longitude: 10, timestamp: 3000}
        const points: IPositionAtTime[] = [p1,p2]
        let result = getPrevAndNextPoints(points, 2000)
        expect(result.prev).toEqual(p1)
        expect(result.next).toEqual(p2)
    })
})
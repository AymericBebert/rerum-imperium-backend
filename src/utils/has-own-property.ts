export function hasOwnProperty<X, Y extends PropertyKey>(
    obj: X,
    prop: Y,
): obj is X & Record<Y, unknown> {
    return typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, prop);
}

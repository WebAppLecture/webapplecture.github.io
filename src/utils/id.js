let id = 1;

export function getId(prefix) {
  return `${prefix}-${id++}`;
}

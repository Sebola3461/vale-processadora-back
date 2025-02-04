export function GetArrayDuplicates<T>(arr: any[]) {
  const seen = new Set();
  const duplicates = new Set();

  arr.forEach((item) => {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  });

  return [...duplicates] as T[]; // Convert Set to Array
}

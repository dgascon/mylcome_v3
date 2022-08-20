export const splitToSubstrings = (str: string, n: number): string[] => {
    const arr: string[] = [];

    for (let index: number = 0; index < str.length; index += n) {
        arr.push(str.slice(index, index + n));
    }

    return arr;
}
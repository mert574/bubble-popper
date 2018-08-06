export function randInt(max) {
    const chance = 1 / max;

    let rand = Math.random();
    let counter = 0;

    while (rand >= 0) {
        rand -= chance;
        counter++;
    }

    return counter;
}
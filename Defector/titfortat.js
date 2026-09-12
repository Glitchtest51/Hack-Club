export default function bot({ history, memory }) {
    if (history.length === 0) return ["C", memory]
    let move = history.at(-1).opponent
    return [move, memory]
}
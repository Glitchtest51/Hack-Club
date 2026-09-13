export default function bot({ history, memory }) {
    if (hLen === 0) return ["C", memory]
    return [history.at(-1).opponent, memory]
}
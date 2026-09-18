export default function bot({ history, memory }) {
    const hLen = history.length
    let mem = memory
    if (mem == null) mem = {tit: 0}
    if (hLen === 0) return ["C", mem]

    let oppDefected = false
    let dCount = 0
    for (let i = 0; i < hLen; i++) {
        if (history[i].opponent === "D") {
            oppDefected = true
            dCount++
        }
    }

    if (oppDefected) {
        let dCountLast5 = 0
        for (let i = hLen; i >= Math.max(0, hLen-5); i--) {
            if (history[i].opponent === "D") {
                dCountLast5++
            }
        }
        if (dCount === 1) return ["C", mem]
        if (dCountLast5 === 2) return ["D", mem]
        if (dCountLast5 >= 3) {
            mem.tit = 5
        }
    }

    // tit for tat
    if (mem.tit > 0) mem.tit--
    return [history.at(-1).opponent, mem]
}
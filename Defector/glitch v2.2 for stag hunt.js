// Apex probe
const PROBE = "CCCCCCCCCDCC"
const EXPECTED = "CCCCDCDCDCCC"

export default function bot({ history, memory }) {
    const hLen = history.length

    let isapex = false
    for (let i = 0; i < Math.min(hLen, EXPECTED.length); i++) {
        if (history[i].you !== PROBE[i] || history[i].opponent !== EXPECTED[i]) {
            isapex = false
            break
        } else isapex = true
    }

    if (isapex) {
        if (hLen < PROBE.length) return [PROBE[hLen], null]

        if (hLen >= 2 && history[hLen - 1].opponent === "D" && history[hLen - 2].opponent === "D") {
            isapex = false
        } else {
            return ["C", null]
        }
    }

    // probe 1
    if (hLen === 0) return ["C", memory]

    // random check
    let c = 0
    let d = 0
    let tft = 0
    let checked = 0

    for (let i = 0; i < hLen; i++) {
        if (history[i].opponent === "C") c++
        else d++

        if (i>=1) {
            checked++
            if (history[i].opponent === history[i-1].you) tft++
        }
    }

    const cRate = c / hLen
    const tftRate = tft / checked
    if (cRate > 0.25 && cRate < 0.75 && tftRate > 0.25 && tftRate < 0.75) return ["D", memory]

    // fallback
    let oppDefected = false
    for (let i = 0; i < hLen; i++) {
        if (history[i].opponent === "D") {
            oppDefected = true
            break
        }
    }

    // abuse always c
    if (!oppDefected) {
        let OurLastD = -1

        for (let i = hLen-1; i >= 0; i--) {
            if (history[i].you === "D") {
                OurLastD = i
                break
            }
        }

        if (OurLastD === -1) {
            return ["C", memory]
        } 

        if (OurLastD === hLen - 1) return ["C", memory]

        return ["D", memory]
    }

    const last = history[hLen - 1]
    const previous = hLen >= 2 ? history[hLen - 2] : null
    const befPrevious = hLen >= 3 ? history[hLen - 3] : null

    // recovery
    if (last.opponent === "D" && previous != null && previous.you === "D" && (previous.opponent === "C" || (befPrevious != null && befPrevious.opponent === "C"))) {
        return ["C", memory]
    }

    // tit for tat
    return [last.opponent, memory]
}
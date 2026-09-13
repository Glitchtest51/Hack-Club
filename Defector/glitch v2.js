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
            const farm = "CDDDCDDDDCDDDD"
            return [farm[(hLen - PROBE.length) % farm.length], null]
        }
    }

    if (hLen === 0) return ["C", memory]

    let oppDefected = false

    for (let i = 0; i < hLen; i++) {
        if (history[i].opponent === "D") {
            oppDefected = true
            break
        }
    }

    if (!oppDefected) {
        let OurLastD = -1

        for (let i = hLen-1; i >= 0; i--) {
            if (history[i].you === "D") {
                OurLastD = i
                break
            }
        }

        if (OurLastD === -1) {
            if (hLen >= 5) {
                return ["D", memory]
            }
            return ["C", memory]
        } 

        if (OurLastD === hLen - 1) {
            return ["C", memory]
        } 

        return ["D", memory]
    }

    const last = history[hLen - 1]
    const previous = hLen >= 2 ? history[hLen - 2] : null

    if (last.opponent === "D" && previous != null && previous.you === "D") {
        return ["C", memory]
    }

    return [history.at(-1).opponent, memory]
}
export default function bot({ history, memory }) {
    let move = ""
    const oppHistory = history.map(x => x.opponent)
    if (memory == null) memory = {coopAtStartRandom: Math.floor(Math.random() * 10), state: "start"}
    const coopAtStartRandom = memory.coopAtStartRandom
    let state = memory.state

    if (history.length < coopAtStartRandom) {
        move = "C"
        memory = {coopAtStartRandom, state}
        return [move, memory]
    }

    if (history.length === coopAtStartRandom) {
        move = "D"
        memory = {coopAtStartRandom, state}
        return [move, memory]
    }

    if (history.length === coopAtStartRandom + 1) {
        move = "C"
        memory = {coopAtStartRandom, state}
        return [move, memory]
    }
    
    if (history.length === coopAtStartRandom + 2) {
        if (oppHistory[coopAtStartRandom + 1] === "C") state = "exploit"
        else state = "recovery"
    }

    switch (state) {
        case "exploit": {
            if (oppHistory.slice(Math.max(0, oppHistory.length - 3)).filter(x => x === "D").length >= 2) {
                state = "defense"
                break
            } else {
                move = "D"
                memory = {coopAtStartRandom, state}
                return [move, memory]
            }
        }
        case "recovery": {
            if (oppHistory[oppHistory.length - 1] === "C") {
                state = "cooperate"
                move = "C"
                memory = {coopAtStartRandom, state}
                return [move, memory]
            } else {
                state = "defense"
                move = "D"
                memory = {coopAtStartRandom, state}
                return [move, memory]
            }
        }
        case "cooperate": {
            if (oppHistory.slice(Math.max(0, oppHistory.length - 4)).filter(x => x === "D").length >= 2) {
                state = "defense"
                move = "D"
                memory = {coopAtStartRandom, state}
                return [move, memory]
            }

            move = "C"
            memory = {coopAtStartRandom, state}
            return [move, memory]
        }
        case "defense": {
            let recent = oppHistory.slice(Math.max(0, oppHistory.length - 6))
            let defectRate = recent.filter(x => x === "D").length / recent.length

            if (defectRate >= 0.35) {
                move = "D"
                memory = {coopAtStartRandom, state}
                return [move, memory]
            }

            move = "C"
            memory = {coopAtStartRandom, state}
            return [move, memory]
        }
    }


    move = "C"
    memory = {coopAtStartRandom, state}
    return [move, memory]
}
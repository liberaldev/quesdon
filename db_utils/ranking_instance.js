// 인스턴스별 사용자 수 랭킹
// RoboMongo 사용

(function()
{
    let hostNames = db.getCollection('users').find({}, {acctLower: 1}).map(user => user.acctLower.split("@").pop()).filter(hostName => hostName)
    let count = {}

    hostNames.forEach(hostName => 
        {
            if (count[hostName] == null) count[hostName] = 0
            count[hostName]++
        })

    let sortedCount = Object.keys(count).map(hostName => [hostName, count[hostName]]).sort((a, b) => b[1] - a[1])

    count = {}

    sortedCount.forEach(a => 
        {
            count[a[0]] = a[1]
        })

    return count
})()

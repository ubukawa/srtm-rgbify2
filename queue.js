const Queue = require('better-queue')



const queue = new Queue(async (t, cb) => {
    const startTime = new Date()
    const key = t.key
    const tile = t.tile
    const [z, x, y] = tile

    //console.log(key)
    //console.log(tile)
    //console.log(tile[2] % 3)
    let time = (tile[2] % 3) *1000
    setTimeout(()=>{
        const endTime = new Date()
        let diff = endTime - startTime
        console.log(`${key}: ${startTime.toISOString()}  --> ${endTime.toISOString()}, ${diff/1000}  `)
        return cb()
    }, time)
    
},{
    concurrent: 3,
    maxRetries: 3,
    retryDelay: 5
})




const queueTasks = () => {
    //for (let module of Object.keys(modulesObj)){
    for (let tile of [[6,32,20],[6,32,21],[6,32,22],[6,32,23],[6,33,20],[6,33,21],[6,33,22]]){
    //for (let key of ['bndl1', 'bndl2', 'bndl3', 'bndl4', 'bndl5', 'bndl6', 'bndl7', 'bndl8', 'bndl9', 'bndl10', 'bndl11', 'bndl12']){
        //let tile = module.split('-').map(v => Number(v))
        let key = `${tile[0]}-${tile[1]}-${tile[2]}`
        queue.push({
            key: key,
            tile: tile
        })
    }
}



const shutdown = () => {
    console.log('** production system shutdown! (^_^) **')
  }

  const main = async () =>{
    const stTime = new Date()
    console.log(`-------UNVT---------------\n${stTime.toISOString()}: Production starts. \n--------------------------`)
    //console.log(`Here is the list of ${Object.keys(modulesObj).length} modules: \n${Object.keys(modulesObj)}`) 
    queueTasks()
    queue.on('drain', () => {
        const closeTime = new Date()
        console.log(`Production ends: ${stTime.toISOString()} --> ${closeTime.toISOString()}`)
        shutdown()
    })
}

main()
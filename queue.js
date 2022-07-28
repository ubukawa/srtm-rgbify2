const Queue = require('better-queue')
const fs = require('fs')
const {spawn} = require('child_process')
const tilebelt = require('@mapbox/tilebelt')

let modulesObj = {} //object {key: [srcFile, ... ], ...}
let emptyModules = []
let keys = [] 
let countModule = 0

let fileList = fs.readdirSync('src') //list from the src folder
fileList = fileList.filter(r => r.indexOf('.tif') !== -1) //only tiff file
let srtmFiles = [] //list from the src folder. file name: nXX_eXXX_1arc_V3.tif
for (let i=0; i<fileList.length; i++){
    srtmFiles.push(fileList[i].replace('SRTM1','').replace('W','_w').replace('E','_e').replace('V3','_1arc_v3.tif').toLowerCase())
}

for (x = 0; x < 64; x ++){
    for (y = 0; y < 64; y++) {
        let key = `6-${x}-${y}`
        keys.push(key)
    }
}

for (const key of keys){
    //for (const key of ['6-31-31','6-32-32']){
        let [tilez, tilex, tiley] = key.split('-')
        tilex = Number(tilex)
        tiley = Number(tiley)
        tilez = Number(tilez)
        const bbox = tilebelt.tileToBBOX([tilex, tiley, tilez])
        modulesObj[key] = []
    
        for (x=Math.floor(bbox[0]); x < bbox[2]; x++ ){
            m = x.toString(10) // 10 means decimal
        
            if(x < 0) {
                m = m.replace("-","")
                if(m.length == 1){
                    m = `00${m}`
                } else if (m.length == 2) {
                    m = `0${m}`
                }
                m = `W${m}`
            } else {
                if(m.length == 1){
                    m = `00${m}`
                } else if (m.length == 2) {
                    m = `0${m}`
                }
                m = `E${m}`
            } // Then, m has proper string
    
            for (y = Math.floor(bbox[1]); y < bbox[3]; y++){
                n = y.toString(10)
                if(y<0){
                    n = n.replace("-","")
                    if(n.length == 1) {
                        n = `0${n}` 
                    }
                    n = `S${n}`
                } else {
                    if(n.length == 1) {
                        n = `0${n}` 
                    }
                    n = `N${n}`
                }
                nm = `${n.toLowerCase()}_${m.toLowerCase()}_1arc_v3.tif`
                if(srtmFiles.includes(nm)){
                    //console.log (`${nm}---> yes(${key})`)
                    modulesObj[key].push(`src/${nm}`)
                }    
            }
        }
        if (Object.keys(modulesObj[key]).length == 0) {
            emptyModules.push(key)
        } 
        if (modulesObj[key].length == 0){
            delete modulesObj[key]
        } 
    
    }



const queue = new Queue(async (t, cb) => {
    const startTime = new Date()
    const key = t.key
    const tile = t.tile
    const [z, x, y] = tile


    console.log(`${key}: ${modulesObj[key]}`)
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
    for (let tile of [[6,41,29],[6,45,29],[6,46,29],[6,48,29],[6,49,29],[6,50,29],[6,51,29],[6,53,29],[6,54,29],[6,62,29]]){
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
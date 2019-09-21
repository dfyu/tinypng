#!/usr/bin/env node
const https = require("https")
const fs = require("fs")
const path = require('path')
const cwd = process.cwd()

let inputs = process.argv.slice(2, process.argv.length)

if (inputs.length > 0) {
    inputs.map(input => {
        let inputpath = path.resolve(cwd, input)
        if (isFile(inputpath)) {
            tinyImage(inputpath)
        } else {
            fs.readdirSync(input).map(file => tinyImage(
                path.resolve(cwd, input, file)
            ))
        }
    })
    
}

function tinyImage (filepath) {
    if (isImage(filepath) && isFile(filepath)) {
        getTinyImagePath(filepath)
            .then(link => {
                let ws = fs.createWriteStream(filepath)
                let req = https.request(new URL(link), res => {
                    res.pipe(ws)
                })
                req.end()
            })
    }
    
}

function isImage (filepath) {
    return /\.png|jpg|jpeg$/.test(filepath)
}

function isFile (filepath) {
    return fs.statSync(filepath).isFile()
}

function formatSize (size) {
    if (size > 1024 * 1024) {
        let num = Number((size / 1024 / 1024).toFixed(2))
        return num.toString() + "MB"
    }
    let num = Number((size / 1024).toFixed(2))
    return num.toString() + "KB"
}

function getTinyImagePath (filepath) {
    console.log(filepath)
    return new Promise((resolve, reject) => {
        const req = https.request(new URL('https://api.tinify.com/shrink'), {
            method: 'post',
            headers: {
                "Authorization": `Basic ${Buffer.from(":T6VVPZzTjzdqlb8WP25TX8nMbr0tsSgN").toString("base64")}`
            } 
        }, (res) => {
            let data = ""
            console.log(filepath)
            res.on("data", chunk => data += chunk)
            res.on("end", () => {
                data = JSON.parse(data)
                if (data.output && data.output.url) {
                    console.log(`${formatSize(data.input.size)} > ${formatSize(data.output.size)}`)
                    resolve(data.output.url)
                    return
                }
                reject(data)
            })
        })
        req.on("error", reject)
        req.write(fs.readFileSync(filepath))
        req.end()
    })
}


function upload_smms(imgs = []) {
    const imgTask = []
    if (Array.isArray(imgs)) {
        for (let url of imgs) {
            const promisTask = new Promise((resolve, reject) => {
                wx.uploadFile({
                    url: 'https://sm.ms/api/upload',
                    name: 'smfile',
                    filePath: url,
                    success(res) {
                        if (res.statusCode === 200) {
                            resolve(JSON.parse(res.data))
                        } else {
                            reject(res)
                        }
                    },
                    fail(err) {
                        reject(err)
                    }
                })
            })
            imgTask.push(promisTask)
        }
    }
    return Promise.all(imgTask)
}

function upload_picp(imgs = [], pichost = 'smms') {
    const imgTask = []
    if (Array.isArray(imgs)) {
        for (let url of imgs) {
            const promisTask = new Promise((resolve, reject) => {
                wx.uploadFile({
                    url: 'https://picp.bsswhg.com/upload.php',
                    name: 'file',
                    filePath: url,
                    header: {
                        Accept: 'application/json'
                    },
                    formData: {
                        pichost: pichost
                    },
                    success(res) {
                        if (res.statusCode === 200) {
                            const data = JSON.parse(res.data)
                            if (data.msg === 'ok') {
                                resolve(data.data)
                            } else {
                                reject(data)
                            }
                        } else {
                            reject(res)
                        }
                    },
                    fail(err) {
                        console.log(err)
                        reject(err)
                    }
                })
            })
            imgTask.push(promisTask)
        }
    }
    return Promise.all(imgTask)
}


exports.upload = {
    smms: upload_smms,
    picp: upload_picp
}
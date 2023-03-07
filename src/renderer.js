const { ipcRenderer, shell, remote } = require('electron')
const FSDB = require("file-system-db");
require('dotenv').config()
const winston = require("winston");
const path = require("path");
const audio = new Audio(path.join(__dirname, 'alarm.wav'));
const db = new FSDB("db.json", false);
const dbAuth = new FSDB("secret.json", true);



renderData()
const logger = winston.createLogger({
    level: "info",
    maxsize: 5242880, // 5MB
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),

    transports: [
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log" }),
    ],
});

ipcRenderer.on('refresh', async() => {
    try {
        await fetch(`${process.env.API_URL}/worklist/critical/examination`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer "+dbAuth.get("token")
            },
            // body: bodyJson,
        })
            .then((response) => response.json())
            .then(function (d) {
                console.log(d)
                logger.info("Reload pada : "+ new Date().toLocaleDateString('id-ID')+" "+new Date().toLocaleTimeString('id-ID'))
                if(d.error) {
                    logger.error(d.error)
                }
                if(d.status) {
                    db.deleteAll()
                    d.data.forEach((el) => {
                        db.set(`${el.regis_id}`, {
                            "lno": el.lno,
                            "sending_date": el.sending_date,
                            "mrn": el.mrn,
                            "patient_name": el.patient_name,
                            "ward_id": el.ward_id,
                            // "process_id": el.process_id,
                            "test": el.test,
                        })
                    })
                    renderData()

                }
            }).catch((err) => {
                logger.error(err)
            });
    } catch (error) {
        // alert("Terjadi kesalahan pada server.");
        logger.error(error)
    }
})

ipcRenderer.on('ready', async(event) => {
    
        try {
        await fetch(`${process.env.API_URL}/worklist/critical/examination`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer "+dbAuth.get("token")
            },
            // body: bodyJson,
        })
            .then((response) => response.json())
            .then(function (d) {
                if(d.error) {
                    logger.error(d.error)
                }
                if(d.status) {
                    db.deleteAll()
                    d.data.forEach((el) => {
                        db.set(`${el.regis_id}`, {
                            "lno": el.lno,
                            "sending_date": el.sending_date,
                            "mrn": el.mrn,
                            "patient_name": el.patient_name,
                            "ward_id": el.ward_id,
                            // "process_id": el.process_id,
                            "test": el.test,
                        })
                    })
                renderData()
                logger.info(new Date().toLocaleDateString('id-ID')+" "+new Date().toLocaleTimeString('id-ID') +" : Successfully get data critical")

                }
            });
    } catch (error) {
        // alert("Terjadi kesalahan pada server.");
        logger.error(new Date().toLocaleDateString('id-ID')+" "+new Date().toLocaleTimeString('id-ID') +" : Error "+error)
    }

})
ipcRenderer.on('notif', async(event, arg) => {
    arg = JSON.parse(arg)

    // try {
    //     await fetch(`${process.env.API_URL}/worklist/critical/examination`, {
    //         method: "GET",
    //         headers: {
    //             "Content-Type": "application/json",
    //             "Authorization": "Bearer "+dbAuth.get("token")
    //         },
    //         // body: bodyJson,
    //     })
    //         .then((response) => response.json())
    //         .then(function (d) {
    //             console.log(d)
    //             if(d.status) {
    //                 db.deleteAll()
    //                 d.data.forEach((el) => {
    //                     db.set(`${el.regis_id}`, {
    //                         "lno": el.lno,
    //                         "sending_date": el.sending_date,
    //                         "mrn": el.mrn,
    //                         "patient_name": el.patient_name,
    //                         "ward_id": el.ward_id,
    //                         // "process_id": el.process_id,
    //                         "test": el.test,
    //                     })
    //                 })
    //             renderData()
    //             // db.delete(id)
    //             // let patientElement = document.getElementById('patient-'+id).remove()
    //             // console.log(patientElement)
    //             // return alert("Berhasil ambil data!")
    //             }
    //         });
    // } catch (error) {
    //     alert("Terjadi kesalahan pada server.");
    //     logger.error(error)
    // }

    const notifs = db.all();

    let isNew = true

    if (notifs.length > 0) {
        notifs.forEach(item => {
            if (item.ID == arg.regis_id) {
                db.delete(item.ID)
                isNew = true;
            }
        })
    }

    
    if (isNew) {
        db.set(`${arg.regis_id}`, {
            "lno": arg.lno,
            "sending_date": arg.sending_date,
            "mrn": arg.mrn,
            "patient_name": arg.patient_name,
            "ward_id": arg.ward_id,
            "process_id": arg.process_id,
            "test": arg.test,
        })
        createNotification(arg)
    }
    renderData()

})



function handlePatient(ID, ward_id) {
    openLink({ regis_id: ID, ward_id: ward_id })
};

var defaultName;
function minimaze(e) {
    console.log(e)
    remote.BrowserWindow.getFocusedWindow().minimize();
}
function handleInput(inputIndex) {
    // win.webContents.openDevTools()
    let inputValue = document.getElementById("inputId-"+inputIndex)
    console.log(inputValue.value)
    let inputValidation = document.getElementsByClassName("inputValidation")
    setTimeout(() => {
        Array.from(inputValidation).forEach(element => {
            element.value = inputValue.value
        });
    }, 200)
    // inputValidation.map(item => {
    //     item.value = item.value
    // })
    // return e
}
async function handleConfirm(id, ward_id, lno, mrn, patient_name, test, value, flag, regis_id, index) {
    
    // console.log(data)

    let responder = document.getElementById("inputId-"+index).value


    if (!responder) return alert("Isi textboxt terlebih dahulu!")
    var bodyJson = JSON.stringify({
        "regis_id": regis_id,
        "ward_id": ward_id,
        "test": test,
        "value": value,
        "flag": flag,
        "uid_exam": id,
        "lno": lno,
        "mrn": mrn,
        "patient_name": patient_name,
        "response_name": responder
    })
    // console.log(bodyJson)
    try {
        await fetch(`${process.env.API_URL}/worklist/critical/responsetime`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer "+dbAuth.get("token")
            },
            body: bodyJson,
        })
            .then((response) => response.json())
            .then(function (d) {
                if(d.error) {
                    logger.error(d.error)
                }
                if(d.status) {
                db.delete(id)
                renderData()
                return alert("Berhasil dikonfirmasi!")
                }
            });
    } catch (error) {
        // alert("Terjadi kesalahan pada server.");
        logger.error(error)
    }
}
function renderData() {
    const element = document.getElementById('notif-list');
    const notifs = db.all()
    // console.log("DATA", notifs)
    
    if (notifs.length > 0) {
        audio.loop = true;
        audio.play();
    } else {
        audio.pause();
        ipcRenderer.send('hideWindow')
    }
    let defaultName = ''
    // onclick="handlePatient(${item.ID}, ${item.data.ward_id})">
    let li = notifs.map((item, index) => {
        return `
        <li id="patient-${item.ID}">
          <table class="w-100">
            <tr class="">
            <td>${item.data.sending_date}</td>
            <td>${item.data.lno}</td>
              <td>${item.data.mrn}</td>
              <td>${item.data.patient_name}</td>
              <td> ${item.data.test.map(el => {
                return `<li style="text-align: center">${el.test.test_name}</li>`
                })}
                </td>
              <td>${item.data.test.map(el => {
                return `<li style="text-align: center">${el.value}</li>`
                })}</td>
              <td>${item.data.test.map(el => {
                return `<li style="text-align: center">${el.flag}</li>`
                })}</td>
              <td>
              <textarea style="width: 70px" id="inputId-${index}" class="inputValidation" onbeforeinput="handleInput(${index})" value="" name="confirmedBy"></textarea>
              </td>
              <td>
              <button type="button" class="btn-validasi" onclick="handleConfirm('${item.ID}','${item.data.ward_id}', '${item.data.lno}', '${item.data.mrn}', 
              '${item.data.patient_name}', '${item.data.test}', '${item.data.value}', '${item.data.flag}', '${item.data.regis_id}', ${index})">Konfirmasi</button>
              </td>
            </tr>
          </table>
        </li>
       
        `
    }).join('')

    if (li == '') {
        li = '<li><p class="no-patient">Tidak ada pasien kritis</p></li>'
    }
    element.innerHTML = li
}

function createNotification(data) {
    // send ipc to main
    ipcRenderer.send('showWindow')

    const notification = new Notification('Pasien Kritis', {
        body: data.patient_name,
        silent: true,
    })

    notification.onclick = () => {
        openLink(data)
    }
}

function openLink(data) {
    const token = dbAuth.get("token")
    const url = `${process.env.LIS_URL}/auto?id=${data.regis_id}&wid=${data.ward_id}&token=${token}`
    shell.openExternal(url);
}
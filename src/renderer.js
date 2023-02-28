const { ipcRenderer, shell } = require('electron')
const FSDB = require("file-system-db");
require('dotenv').config()
const path = require("path");
const audio = new Audio(path.join(__dirname, 'alarm.wav'));
const db = new FSDB("db.json", false);
const dbAuth = new FSDB("secret.json", true);



renderData()

ipcRenderer.on('notif', (event, arg) => {
    arg = JSON.parse(arg)

    const notifs = db.all();

    let isNew = true

    if (notifs.length > 0) {
        notifs.forEach(item => {
            if (item.ID == arg.uid_exam) {
                db.delete(item.ID)
                isNew = true;
            }
        })
    }

    
    if (isNew) {
        db.set(`${arg.uid_exam}`, { 
            "lno": arg.lno,
            "mrn": arg.mrn,
            "patient_name": arg.patient_name,
            "ward_id": arg.ward_id,
            "process_id": arg.process_id,
            "test": arg.test,
            "value": arg.value,
            "flag": arg.flag,
            "regis_id": arg.regis_id
        })
        createNotification(arg)
    }
    renderData()

})

function handlePatient(ID, ward_id) {
    openLink({ regis_id: ID, ward_id: ward_id })
};

var defaultName;

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
                console.log(d.status)
                console.log(d)
                if(d.status) {
                db.delete(id)
                location.reload()
                return alert("Berhasil!")
                }
            });
    } catch (error) {
        alert("Request failed", error);
    }
}
function renderData() {
    const element = document.getElementById('notif-list');
    const notifs = db.all()
    console.log("DATA", notifs)
    
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
        <li>
        <button class="list-pasien w-100">
          <table class="w-100">
            <tr class="tr-btn">
              <td>${item.data.lno}</td>
              <td>${item.data.mrn}</td>
              <td>${item.data.patient_name}</td>
              <td>${item.data.test}</td>
              <td>${item.data.value}</td>
              <td>${item.data.flag}</td>
              <td>
              <textarea style="width: 70px" id="inputId-${index}" class="inputValidation" onbeforeinput="handleInput(${index})" value="" name="confirmedBy"></textarea>
              </td>
              <td>
              <button type="button" class="btn-validasi" onclick="handleConfirm('${item.ID}','${item.data.ward_id}', '${item.data.lno}', '${item.data.mrn}', 
              '${item.data.patient_name}', '${item.data.test}', '${item.data.value}', '${item.data.flag}', '${item.data.regis_id}', ${index})">Konfirmasi</button>
              </td>
            </tr>
          </table>
        </button>
        </li>`;
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
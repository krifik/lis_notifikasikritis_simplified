const { ipcRenderer, shell } = require('electron')
const FSDB = require("file-system-db");
require('dotenv').config()
const audio = new Audio('alarm.wav');
const db = new FSDB("db.json", false);

renderData()

ipcRenderer.on('notif', (event, arg) => {
    arg = JSON.parse(arg)

    const notifs = db.all();

    let isNew = true

    if (notifs.length > 0) {
        notifs.forEach(item => {
            if (item.ID == arg.regis_id) {
                db.delete(item.ID)
                isNew = false;
            }
        })
    }

    
    if (isNew) {
        db.set(`${arg.regis_id}`, { "patient_name": arg.patient_name, "ward_id": arg.ward_id, "process_id": arg.process_id })
        createNotification(arg)
    }
    renderData()

})

document.getElementById('btn').addEventListener('click', () => {
    ipcRenderer.send('button', 'button clicked')
    audio.pause();
})

var elements = document.getElementsByClassName("list-pasien");

var handlePatient = function () {
    const regis_id = this.getAttribute('data-regis')
    const ward_id = this.getAttribute('data-wid')
    openLink({ regis_id: regis_id, ward_id: ward_id })
};

for (var i = 0; i < elements.length; i++) {
    elements[i].addEventListener('click', handlePatient, false);
}

function renderData() {
    const element = document.getElementById('notif-list');
    const notifs = db.all()

    if (notifs.length > 0) {
        audio.loop = true;
        audio.play();
    } else {
        audio.pause();
    }

    const li = notifs.map(item => {
        return `
        <li>
        <button class="list-pasien" data-regis="${item.ID}" data-wid="${item.data.ward_id}">${item.data.patient_name}</button>
        </li>`
    }).join('')
    element.innerHTML = li
}

function createNotification(data) {
    const notification = new Notification('Pasien Kritis', {
        body: data.patient_name,
        silent: true,
    })

    notification.onclick = () => {
        openLink(data)
    }
}

function openLink(data) {
    const url = `${process.env.LIS_URL}worklist/${data.regis_id}?WID=${data.ward_id}`
    shell.openExternal(url);
}
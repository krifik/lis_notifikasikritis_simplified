# lis_notifikasikritis

## How to run

```npm install```

```npm run start```

## How to Build
```npm run build```
build output will be available in ```dist``` folder

## How to force fresh/ clean up app notification 
- Edit ```db.json``` to ```{}```, this will initialize app db

## How to setup Auto Login
- Run the app
- Right click tray icon, click Auto Login
- Provide username and password, and you are done

## How to force logout
- Edit ```secret.json``` to ```{}```, this will remove saved token and you need to setup auto login again

## How to try send directly from redis (for testing)
Run this on redis-cli

old data, not working anymore. but, i decided to leave here. just in case it rollback to old version
try critical
publish 9510_responsetime "{\"lno\": \"123\",\"mrn\": \"321\",\"patient_name\": \"budi\",\"regis_id\": \"1\",\"ward_id\": \"1\"}"

try response
publish 9510_responsetime "{\"lno\": \"123\",\"mrn\": \"321\",\"patient_name\": \"budi\",\"regis_id\": \"1\",\"ward_id\": \"1\"}"

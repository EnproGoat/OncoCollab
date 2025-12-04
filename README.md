# OncoCollab – Guide de déploiement

OncoCollab est une application de visioconférence basée sur WebRTC, un serveur WebSocket Node.js et un serveur TURN, permettant la communication entre utilisateurs.

Ce guide explique comment lancer toute l’infrastructure : serveur, front-end, tunnel ngrok et serveur TURN.

## 🚀 1. Prérequis

Assurez-vous d’avoir installé :

- Node.js ≥ 18

- npm

- ngrok : https://ngrok.com/download

- Docker & Docker Compose

- Un réseau WiFi qui autorise la connexion entre les autres appareils
> [!IMPORTANT]
> ⚠️ Eduroam bloque les connexions direct à d'autre appareil

## 📡 2. Lancer le serveur WebSocket

``` bash
cd server
npm install
npm run dev
```
> [!NOTE]  
> Vous avez seulement besoin de faire npm install une seul fois pour installer les packages

- Le serveur démarre en local sur :
> http://localhost:3000

## 🌐 3. Ouvrir un tunnel ngrok (obligatoire)

Dans un autre terminal :

``` bash
ngrok http 3000
```

Ngrok vous donnera une URL publique comme :

> https://abcd-1234.ngrok-free.app



- Avant le lancement de l'app, modifiez l’URL du WebSocket dans la configuration front-end (ex : types/socket.ts, VideoCall.tsx, etc.) :

``` ts
const SERVER_URL = 'wss://abcd-1234.ngrok-free.app';
```

✔️ Remplacez cette URL par celle donnée par ngrok.


## 🔐 4. Lancer le serveur TURN

Le serveur TURN permet la connexion via un serveur ce qui remplace les connexions directes.

- Démarrage avec Docker :

``` bash
docker compose up -d
```

Configuration du TURN dans le front-end (remplacez par l’IP locale de votre machine) :

``` ts
const ICE_SERVERS: [
  {
    urls: ["turn:192.168.x.x:3478"], // la partie à modifier
    username: "admin",
    credential: "password",
  }
];
```

> [!IMPORTANT]  
> ⚠️ Le serveur TURN doit être accessible sur le même réseau local 

- RAPPEL : Eduroam ne supporte pas la connexion direct entre appareil

## 🖥️ 5. Lancer l'application front-end (Visio App)

``` bash
cd visio-app
npm install
npm run dev
```
Vous aurez normalement un lien pour accéder à l'application
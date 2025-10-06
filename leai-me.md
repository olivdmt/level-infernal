# COMANDOS A SEREM EXECUATODOS.

./app/Frontend

npm install --global yarn
yarn install

./app/Backend

python -m venv venv
./venv/Scripts/Activate.ps1
pip install -r ./requirements.txt

python ./server.py
npm start

# 🗂️ Estrutura Completa dos Arquivos do Projeto
Arquivos Principais:
/app/frontend/src/mock.js ⭐ MAIS IMPORTANTE

Contém TODOS os 10 níveis do jogo
Configuração de plataformas, armadilhas, spawn e porta de saída
Mensagens troll que aparecem ao morrer
/app/frontend/src/components/GameEnhanced.jsx

Lógica principal do jogo (física, colisões, movimentação)

Sistema de renderização do Canvas
Controle de morte, vida, níveis
Interface do usuário (UI)
/app/frontend/src/App.js

Arquivo principal que importa o componente do jogo
Configuração de rotas
/app/frontend/src/App.css

Estilos globais
🎮 Tipos de Obstáculos Disponíveis
No arquivo mock.js, você pode usar estes tipos de armadilhas:

Tipo	Descrição	Exemplo
spike	Espinhos que surgem após um tempo	{ type: "spike", x: 600, y: 490, width: 50, height: 20, delay: 1500 }
fake (plataforma)	Plataforma que cai quando pisada	{ x: 350, y: 550, fake: true }
disappear (plataforma)	Plataforma que desaparece após delay	{ x: 300, y: 500, disappear: true, delay: 2000 }
ceiling	Teto que cai esmagando	{ type: "ceiling", x: 350, y: 0, speed: 8, delay: 1500 }
fakeDoor	Porta falsa que mata ao tocar	{ type: "fakeDoor", x: 1250, y: 290, width: 40, height: 60 }


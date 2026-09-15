# HemoAlerta

App mobile de doação de sangue, focado em Minas Gerais (rede Hemominas). Conecta doadores a hemocentros, mostra estoque de sangue por tipo e usa gamificação (XP, níveis, badges) pra incentivar doação recorrente.

Projeto começou como MVP de hackathon e ainda está em desenvolvimento.

## Funcionalidades

- Geolocalização de hemocentros próximos
- Gamificação (XP, níveis, badges)
- Estoque de sangue por tipo sanguíneo
- Gestão de pedidos de doação
- Cadastro e aprovação de hospitais
- Navegação em drawer: Pedidos, Hemocentros, Doadores, Perfil, Estoque

## Stack

- React Native + Expo
- Firebase
- Dados da rede Hemominas em JSON local

## Estrutura do projeto

```
hemoalerta/
├── src/
│   ├── screens/         # Telas do app (Pedidos, Hemocentros, Doadores, Perfil, Estoque)
│   ├── components/      # Componentes reutilizáveis
│   ├── navigation/       # Configuração da navegação (drawer)
│   ├── services/        # Integração com Firebase e dados locais
│   ├── data/            # JSON com dados da rede Hemominas
│   └── assets/          # Imagens e ícones
├── App.js
├── app.json
└── package.json
```

(ajusta essa árvore pra bater com a real do teu projeto)

## Como rodar

Requisitos: Node.js, Expo CLI, e o app Expo Go no celular (ou emulador Android/iOS).

```bash
# Clone o repositório
git clone https://github.com/gabrielsdev6/hemoalerta.git

# Entre na pasta do projeto
cd hemoalerta

# Instale as dependências
npm install

# Inicie o projeto
npx expo start
```

Escaneia o QR code com o Expo Go.

## Configuração

Precisa das credenciais do Firebase (não subir isso no repo, usar `.env.example` como referência):

```
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
```

## Status

Em desenvolvimento. Próximos passos: expandir pra outros estados, testes, publicação nas lojas.

## Autor

Gabriel Pereira — [github.com/gabrielsdev6](https://github.com/gabrielsdev6) · [linkedin.com/in/gabrielpereiraj](https://linkedin.com/in/gabrielpereiraj)

import { BigNumber, Contract, ethers, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, RANDOM_GAME_NFT_CONTRACT_ADDRESS } from "../constants";
import { FETCH_CREATED_GAME } from "../queries";
import styles from "../styles/Home.module.css";
import { subgraphQuery } from "../utils";

export default function Home() {
  const zero = BigNumber.from("0");
// walletConnected realiza un seguimiento de si la billetera del usuario está conectada o no
  const [walletConnected, setWalletConnected] = useState(false);
// loading se establece en verdadero cuando estamos esperando que se extraiga una transacción
  const [loading, setLoading] = useState(false);
// booleano para realizar un seguimiento de si la cuenta conectada actual es propietaria o no
  const [isOwner, setIsOwner] = useState(false);
// entryFee es el ether requerido para ingresar a un juego
  const [entryFee, setEntryFee] = useState(zero);
// maxPlayers es el número máximo de jugadores que pueden jugar el juego
  const [maxPlayers, setMaxPlayers] = useState(0);
// Comprueba si un juego comenzó o no
  const [gameStarted, setGameStarted] = useState(false);
// Jugadores que se unieron al juego
  const [players, setPlayers] = useState([]);
// Ganador del juego
  const [winner, setWinner] = useState();
// Mantenga un registro de todos los registros de un juego determinado
  const [logs, setLogs] = useState([]);
 // Cree una referencia a Web3 Modal (utilizado para conectarse a Metamask) que persiste mientras la página esté abierta
  const web3ModalRef = useRef();
// Esto se usa para forzar la reacción para volver a renderizar la página cuando queremos
   // en nuestro caso usaremos la actualización forzada para mostrar nuevos registros

  const forceUpdate = React.useReducer(() => ({}), {})[1];

/*
     connectWallet: conecta la billetera MetaMask
   */
  const connectWallet = async () => {
    try {
// Obtener el proveedor de web3Modal, que en nuestro caso es MetaMask
       // Cuando se usa por primera vez, solicita al usuario que conecte su billetera
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };
/**
    * Devuelve un objeto Proveedor o Firmante que representa el Ethereum RPC con o sin las
    * capacidades de firma de metamask adjunto
    *
    * Se necesita un 'Proveedor' para interactuar con la cadena de bloques: leer transacciones, leer saldos, leer estados, etc.
    *
    * Un 'Firmante' es un tipo especial de Proveedor que se utiliza en caso de que sea necesario realizar una transacción de 'escritura' en la cadena de bloques, lo que implica la cuenta conectada
    * necesidad de hacer una firma digital para autorizar la transacción que se envía. Metamask expone una API de firmante para permitir que su sitio web
    * solicite firmas del usuario utilizando las funciones de firmante.
    *
    * @param {*} needSigner: verdadero si necesita el firmante, predeterminado falso de lo contrario
    */

  const getProviderOrSigner = async (needSigner = false) => {
   // Conectar a Metamask
     // Dado que almacenamos `web3Modal` como referencia, necesitamos acceder al valor `actual` para obtener acceso al objeto subyacente
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
// Si el usuario no está conectado a la red de Mumbai, infórmele y arroje un error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 80001) {
      window.alert("Cambiar la red a Mumbai");
      throw new Error("Cambiar la red a Mumbai");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

/**
    * startGame: es llamado por el propietario para iniciar el juego
    */
  const startGame = async () => {
    try {
  // Obtenga el firmante de web3Modal, que en nuestro caso es MetaMask
       // No es necesario el firmante aquí, ya que solo estamos leyendo el estado de la cadena de bloques
      const signer = await getProviderOrSigner(true);
// Nos conectamos al Contrato usando un firmante porque queremos que el propietario
       // firme la transacción
      const randomGameNFTContract = new Contract(
        RANDOM_GAME_NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      setLoading(true);
// llamar a la función startGame desde el contrato
      const tx = await randomGameNFTContract.startGame(maxPlayers, entryFee);
      await tx.wait();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

/**
    * startGame: es llamado por un jugador para unirse al juego
    */
  const joinGame = async () => {
    try {
// Obtenga el firmante de web3Modal, que en nuestro caso es MetaMask
       // No es necesario el firmante aquí, ya que solo estamos leyendo el estado de la cadena de bloques
      const signer = await getProviderOrSigner(true);
  // Nos conectamos al Contrato usando un firmante porque queremos que el propietario
       // firma la transacción
      const randomGameNFTContract = new Contract(
        RANDOM_GAME_NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      setLoading(true);
   // llamar a la función startGame desde el contrato
      const tx = await randomGameNFTContract.joinGame({
        value: entryFee,
      });
      await tx.wait();
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

/**
    * checkIfGameStarted comprueba si el juego ha comenzado o no e inicializa los registros
    * para el juego
    */
  const checkIfGameStarted = async () => {
    try {
// Obtener el proveedor de web3Modal, que en nuestro caso es MetaMask
       // No es necesario el firmante aquí, ya que solo estamos leyendo el estado de la cadena de bloques
      const provider = await getProviderOrSigner();
    // Nos conectamos al Contrato utilizando un Proveedor, por lo que solo
       // tener acceso de solo lectura al contrato
      const randomGameNFTContract = new Contract(
        RANDOM_GAME_NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
    // lee el booleano gameStarted del contrato
      const _gameStarted = await randomGameNFTContract.gameStarted();
// Inicializar el array de registros y consultar el grafo para el gameID actual
      const _gameArray = await subgraphQuery(FETCH_CREATED_GAME());
      const _game = _gameArray.games[0];
      let _logs = [];

      if (_gameStarted) {
        _logs = [`El juego ha comenzado con ID: ${_game.id}`];
        if (_game.players && _game.players.length > 0) {
          _logs.push(
            `${_game.players.length} / ${_game.maxPlayers} ya apuntado 👀 `
          );
          _game.players.forEach((player) => {
            _logs.push(`${player} apuntado 🏃‍♂️`);
          });
        }
        setEntryFee(BigNumber.from(_game.entryFee));
        setMaxPlayers(_game.maxPlayers);
      } else if (!gameStarted && _game.winner) {
        _logs = [
          `Último juego ha terminado con ID: ${_game.id}`,
          `Ganador es: ${_game.winner} 🎉 `,
          `Esperando a que el host empiece un nuevo juego....`,
        ];

        setWinner(_game.winner);
      }
      setLogs(_logs);
      setPlayers(_game.players);
      setGameStarted(_gameStarted);
      forceUpdate();
    } catch (error) {
      console.error(error);
    }
  };

 /**
    * getOwner: llama al contrato para recuperar el propietario
    */
  const getOwner = async () => {
    try {
    // Obtener el proveedor de web3Modal, que en nuestro caso es MetaMask
       // No es necesario el firmante aquí, ya que solo estamos leyendo el estado de la cadena de bloques
      const provider = await getProviderOrSigner();
 // Nos conectamos al Contrato utilizando un Proveedor, por lo que solo
       // tener acceso de solo lectura al contrato
      const randomGameNFTContract = new Contract(
        RANDOM_GAME_NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
 // llamar a la funcion dueña del contrato
      const _owner = await randomGameNFTContract.owner();
  // Haremos que el firmante ahora extraiga la dirección de la cuenta MetaMask actualmente conectada
      const signer = await getProviderOrSigner(true);
    // Obtenga la dirección asociada al firmante que está conectado a MetaMask
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

// useEffects se utilizan para reaccionar a los cambios en el estado del sitio web
   // El array al final de la llamada a la función representa qué cambios de estado activarán este efecto
   // En este caso, siempre que cambie el valor de `walletConnected`, se llamará a este efecto
  useEffect(() => {
// si la billetera no está conectada, crea una nueva instancia de Web3Modal y conecta la billetera MetaMask
    if (!walletConnected) {
 // Asigna la clase Web3Modal al objeto de referencia estableciendo su valor `actual`
       // El valor `actual` se conserva mientras esta página esté abierta
      web3ModalRef.current = new Web3Modal({
        network: "mumbai",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getOwner();
      checkIfGameStarted();
      setInterval(() => {
        checkIfGameStarted();
      }, 2000);
    }
  }, [walletConnected]);

/*
     renderButton: Devuelve un botón basado en el estado de la dapp
   */
  const renderButton = () => {
   // Si la billetera no está conectada, devuelve un botón que les permite conectar su billetera
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Conecta tu billetera
        </button>
      );
    }

// Si actualmente estamos esperando algo, devuelve un botón de carga
    if (loading) {
      return <button className={styles.button}>Cargando...</button>;
    }
   // Renderizar cuando el juego ha comenzado
    if (gameStarted) {
      if (players.length === maxPlayers) {
        return (
          <button className={styles.button} disabled>
          Eligiendo ganador...
          </button>
        );
      }
      return (
        <div>
          <button className={styles.button} onClick={joinGame}>
           Unete al juego 🚀
          </button>
        </div>
      );
    }
    // Start the game
    if (isOwner && !gameStarted) {
      return (
        <div>
          <input
            type="number"
            className={styles.input}
            onChange={(e) => {
           // El usuario ingresará el valor en ether, necesitaremos convertir
               // a WEI usando parseEther
              setEntryFee(
                e.target.value >= 0
                  ? utils.parseEther(e.target.value.toString())
                  : zero
              );
            }}
            placeholder="Fee de entrada (ETH)"
          />
          <input
            type="number"
            className={styles.input}
            onChange={(e) => {
      
              setMaxPlayers(e.target.value ?? 0);
            }}
            placeholder="Máximo de jugadores"
          />
          <button className={styles.button} onClick={startGame}>
          Empezar juego 🚀
          </button>
        </div>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>AW3Punks</title>
        <meta name="description" content="AW3Punks-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Bienvenido a Random Winner Game!</h1>
          <div className={styles.description}>
          Es un juego de lotería donde se elige un ganador al azar y gana 
             todo lo se haya apostado 
          </div>
          {renderButton()}
          {logs &&
            logs.map((log, index) => (
              <div className={styles.log} key={index}>
                {log}
              </div>
            ))}
        </div>
        <div>
          <img className={styles.image} src="./randomWinner.png" />
        </div>
      </div>

      <footer className={styles.footer}>Made with &#10084; by AprendeWeb3</footer>
    </div>
  );
}





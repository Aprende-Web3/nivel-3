// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract RandomWinnerGame is VRFConsumerBase, Ownable {

      //Variables Chainlink
     // La cantidad de LINK a enviar con la solicitud
    uint256 public fee;
   // ID de la clave pública contra la que se genera la aleatoriedad
    bytes32 public keyHash;

// Dirección de los jugadores
    address[] public players;
  // Número máximo de jugadores en un juego
    uint8 maxPlayers;
   // Variable para indicar si el juego ha comenzado o no
    bool public gameStarted;
// las tarifas por ingresar al juego
    uint256 entryFee;
   // identificación del juego actual
    uint256 public gameId;
// emitido cuando comienza el juego
    event GameStarted(uint256 gameId, uint8 maxPlayers, uint256 entryFee);
// emitido cuando alguien se une a un juego
    event PlayerJoined(uint256 gameId, address player);
  // emitido cuando termina el juego
    event GameEnded(uint256 gameId, address winner,bytes32 requestId);

 /**
    * el constructor hereda un VRFConsumerBase e inicia los valores para keyHash, fee y gameStarted
    * @param vrfCoordinator dirección del contrato VRFCoordinator
    * @param linkToken dirección del contrato de token LINK
    * @param vrfFee la cantidad de LINK a enviar con la solicitud
    * @param vrfKeyHash ID de la clave pública contra la que se genera la aleatoriedad
    */
    constructor(address vrfCoordinator, address linkToken,
    bytes32 vrfKeyHash, uint256 vrfFee)
    VRFConsumerBase(vrfCoordinator, linkToken) {
        keyHash = vrfKeyHash;
        fee = vrfFee;
        gameStarted = false;
    }
/**
     * startGame inicia el juego estableciendo valores apropiados para todas las variables
     */
    function startGame(uint8 _maxPlayers, uint256 _entryFee) public onlyOwner {
      // Comprueba si ya hay un juego ejecutándose
        require(!gameStarted, "Game is currently running");
        // vaciar el array de jugadores
        delete players;
      // Establece los jugadores máximos para este juego
        maxPlayers = _maxPlayers;
        // establece el juego iniciado en verdadero
        gameStarted = true;
   // configurar la tarifa de entrada para el juego
        entryFee = _entryFee;
        gameId += 1;
        emit GameStarted(gameId, maxPlayers, entryFee);
    }

   /**
     joinGame se llama cuando un jugador quiere entrar en el juego
      */
    function joinGame() public payable {
       // Comprobar si un juego ya se está ejecutando
        require(gameStarted, "Game has not been started yet");
      // Comprobar si el valor enviado por el usuario coincide con la tarifa de entrada
        require(msg.value == entryFee, "Value sent is not equal to entryFee");
      // Comprueba si todavía queda espacio en el juego para agregar otro jugador
        require(players.length < maxPlayers, "Game is full");
    // Agregar el remitente a la lista de jugadores
        players.push(msg.sender);
        emit PlayerJoined(gameId, msg.sender);
      // Si la lista está completa inicia el proceso de selección del ganador
        if(players.length == maxPlayers) {
            getRandomWinner();
        }
    }
/**
     * VRFCoordinator llama a la función fulfillRandomness cuando recibe una prueba VRF válida.
     * Esta función se anula para actuar sobre el número aleatorio generado por Chainlink VRF.
     * @param requestId este ID es único para la solicitud que enviamos al Coordinador VRF
     * @param randomness esta es una unidad aleatoria256 generada y devuelta por el Coordinador VRF
    */

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal virtual override  {
       // Queremos que el índice de ganador tenga una longitud de 0 a players.length-1
         // Para esto lo modificamos con el valor player.length
        uint256 winnerIndex = randomness % players.length;
       // obtener la dirección del ganador del array de jugadores
        address winner = players[winnerIndex];
     // enviar el ether en el contrato al ganador
        (bool sent,) = winner.call{value: address(this).balance}("");
        require(sent, "Failed to send Ether");
     // Emite que el juego ha terminado
        emit GameEnded(gameId, winner,requestId);
        // establece la variable gameStarted en falso
        gameStarted = false;
    }

  /**
     * Se llama a getRandomWinner para iniciar el proceso de selección de un ganador aleatorio
     */
    function getRandomWinner() private returns (bytes32 requestId) {
    // LINK es una interfaz interna para el token Link que se encuentra dentro de VRFConsumerBase
         // Aquí usamos el método balanceOf de esa interfaz para asegurarnos de que nuestro
         // contrato tiene suficiente link para que podamos solicitar el VRFCoordinator para la aleatoriedad
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK");
       // Hacer una solicitud al coordinador VRF.
         // requestRandomness es una función dentro de VRFConsumerBase
         // inicia el proceso de generación de aleatoriedad
        return requestRandomness(keyHash, fee);
    }

   // Función para recibir Ether. msg.data debe estar vacío
    receive() external payable {}

  // Se llama a la función de respaldo cuando msg.data no está vacío
    fallback() external payable {}
}
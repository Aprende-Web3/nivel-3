// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
 
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
 
contract AW3Punks is ERC721Enumerable, Ownable {
    using Strings for uint256;
/**
         * @dev _baseTokenURI para calcular {tokenURI}. Si se establece, el URI resultante para cada
         * token será la concatenación de `baseURI` y `tokenId`.
         */
    string _baseTokenURI;
 
// _price es el precio de un AW3Punks NFT
    uint256 public _price = 0.01 ether;
 
// _paused se usa para pausar el contrato en caso de emergencia
    bool public _paused;
 
// número máximo de AW3Punks
    uint256 public maxTokenIds = 10;
 
   // número total de tokenIds acuñados
    uint256 public tokenIds;
 
    modifier onlyWhenNotPaused {
        require(!_paused, "Contract currently paused");
        _;
    }
/**
         * El constructor @dev ERC721 toma un `nombre` y un `símbolo` para la colección de tokens.
         * el nombre en nuestro caso es `AW3Punks` y el símbolo es `AW3P`.
         * Constructor para AW3P toma baseURI para establecer _baseTokenURI para la colección.
         */
 
    constructor (string memory baseURI) ERC721("AW3Punks", "AW3P") {
        _baseTokenURI = baseURI;
    }
/**
     * @dev mint permite a un usuario acuñar 1 NFT por transacción.
     */
   
function mint() public payable onlyWhenNotPaused {
        require(tokenIds < maxTokenIds, "Exceed maximum AW3Punks supply");
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }
 
 /**
     * @dev _baseURI anula la implementación ERC721 de Openzeppelin que por defecto
     * devolvió una cadena vacía para el baseURI
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }
/**
     * @dev tokenURI anula la implementación ERC721 de Openzeppelin para la función tokenURI
     * Esta función devuelve el URI desde donde podemos extraer los metadatos para un tokenId dado
     */
 
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
 
        string memory baseURI = _baseURI();
    // Aquí se comprueba si la longitud de la baseURI es mayor que 0, si es devuelve la baseURI y adjunta
         // el tokenId y `.json` para que sepa la ubicación del archivo json de metadatos para un determinado
         // tokenId almacenado en IPFS
         // Si baseURI está vacío, devuelve una cadena vacía
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json")) : "";
    }
/**
     * @dev setPaused hace que el contrato sea pausado o no pausado
         */
   
    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }
 
 /**
     * @dev withdraw envía todo el ether en el contrato
     * al titular del contrato
         */
    function withdraw() public onlyOwner  {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) =  _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }
 
       // Función para recibir Ether. msg.data debe estar vacío
    receive() external payable {}
 
   // Se llama a la función de respaldo cuando msg.data no está vacío
    fallback() external payable {}
}
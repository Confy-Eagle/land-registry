// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LandRegistry {
    address public admin; // government/admin account

    constructor() {
        admin = msg.sender; // deployer is admin
    }

    // -------------------- USERS --------------------
    struct User {
        address addr;
        string name;
        bool verified;
    }

    mapping(address => User) public users;

    event UserRegistered(address indexed user, string name);
    event UserVerified(address indexed user);

    function registerUser(string calldata name) external {
        require(users[msg.sender].addr == address(0), "Already registered");
        users[msg.sender] = User(msg.sender, name, false);
        emit UserRegistered(msg.sender, name);
    }

    function verifyUser(address userAddr) external onlyAdmin {
        require(users[userAddr].addr != address(0), "User not registered");
        users[userAddr].verified = true;
        emit UserVerified(userAddr);
    }

    // -------------------- PROPERTIES --------------------
    struct Property {
        uint id;
        string location;
        uint area; // in km^2
        address owner;
        uint price; // in wei
        bool forSale;
    }

    uint[] public propertyIds;
    mapping(uint => Property) public properties;

    event PropertyAdded(uint indexed id, string location, address indexed owner, uint area, uint price);
    event PropertyForSale(uint indexed id, uint price);
    event PropertyTransferred(uint indexed id, address indexed from, address indexed to);

    function addProperty(uint id, string calldata location, uint area, uint price) external onlyVerified {
        require(properties[id].id == 0, "Property already exists");
        properties[id] = Property(id, location, area, msg.sender, price, false);
        propertyIds.push(id);
        emit PropertyAdded(id, location, msg.sender, area, price);
    }

    function markForSale(uint id, uint price) external {
        Property storage p = properties[id];
        require(p.id != 0, "Property does not exist");
        require(p.owner == msg.sender, "Only owner");
        p.forSale = true;
        p.price = price;
        emit PropertyForSale(id, price);
    }

    // -------------------- PURCHASE / SALE --------------------
    struct Purchase {
        address buyer;
        uint amount;
        bool exists;
    }

    mapping(uint => Purchase) public pendingPurchases;

    // Buyer initiates purchase by sending ETH
    function initiatePurchase(uint id) external payable {
        Property storage p = properties[id];
        require(p.id != 0 && p.forSale, "Not for sale");
        require(msg.value == p.price, "Send exact price");
        pendingPurchases[id] = Purchase(msg.sender, msg.value, true);
    }

    // Admin confirms payment and finalizes sale
    function confirmPayment(uint id) external onlyAdmin {
        Purchase memory pr = pendingPurchases[id];
        Property storage p = properties[id];
        require(pr.exists, "No pending purchase");

        address seller = p.owner;
        address buyer = pr.buyer;
        uint amount = pr.amount;

        // Transfer funds to seller
        (bool sent,) = seller.call{value: amount}("");
        require(sent, "Transfer failed");

        // Transfer ownership
        p.owner = buyer;
        p.forSale = false;
        delete pendingPurchases[id];

        emit PropertyTransferred(id, seller, buyer);
    }

    // -------------------- INHERITANCE / DIRECT TRANSFER --------------------
    function transferProperty(uint id, address newOwner) external {
        Property storage p = properties[id];
        require(p.id != 0, "Property does not exist");
        require(p.owner == msg.sender, "Only owner");
        address oldOwner = p.owner;
        p.owner = newOwner;
        p.forSale = false;
        emit PropertyTransferred(id, oldOwner, newOwner);
    }

    // -------------------- GETTERS --------------------
    function getProperty(uint id) external view returns (Property memory) {
        return properties[id];
    }

    function getAllProperties() external view returns (Property[] memory) {
        Property[] memory out = new Property[](propertyIds.length);
        for (uint i = 0; i < propertyIds.length; i++) {
            out[i] = properties[propertyIds[i]];
        }
        return out;
    }

    function getUser(address addr) external view returns (User memory) {
        return users[addr];
    }

    // -------------------- MODIFIERS --------------------
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyVerified() {
        require(users[msg.sender].verified, "User not verified");
        _;
    }

    // Accept plain ETH if needed
    receive() external payable {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LandRegistry {
    struct Property {
        uint id;
        string location;
        address owner;
    }

    mapping(uint => Property) public properties;
    uint[] public propertyIds; // keep track of all IDs

    event PropertyAdded(uint id, string location, address owner);
    event PropertyTransferred(uint id, address oldOwner, address newOwner);

    function addProperty(uint _id, string memory _location) public {
        require(properties[_id].id == 0, "Property already exists");
        properties[_id] = Property(_id, _location, msg.sender);
        propertyIds.push(_id);
        emit PropertyAdded(_id, _location, msg.sender);
    }

    function transferProperty(uint _id, address _newOwner) public {
        require(properties[_id].id != 0, "Property does not exist");
        require(properties[_id].owner == msg.sender, "You are not the owner");
        address oldOwner = properties[_id].owner;
        properties[_id].owner = _newOwner;
        emit PropertyTransferred(_id, oldOwner, _newOwner);
    }

    function getProperty(uint _id) public view returns (uint, string memory, address) {
        require(properties[_id].id != 0, "Property does not exist");
        Property memory p = properties[_id];
        return (p.id, p.location, p.owner);
    }

    // ✅ New function: get all properties
    function getAllProperties() public view returns (Property[] memory) {
        Property[] memory allProps = new Property[](propertyIds.length);
        for (uint i = 0; i < propertyIds.length; i++) {
            allProps[i] = properties[propertyIds[i]];
        }
        return allProps;
    }
}

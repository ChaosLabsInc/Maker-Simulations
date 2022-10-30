![Chaos Labs - Maker Collab](https://github.com/ChaosLabsInc/Maker-Simulations/blob/main/etc/header.png)
# Maker-Simulations

[Blog Posts](https://chaoslabs.xyz/posts/chaos-labs-maker-simulation-series-pt-0)

This repo contains the Chaos simulation scripts used in the Maker simulations. It doesn't include the execution framework and data and analytic infrastructure of the Chaos Cloud. The Chaos Simulation Cloud handles the execution, orchestration, and processing of the simulation running on dedicated on-demand sandbox Blockchain forks.

The scripts are intentionally written be easily adapted into simple Hardhat/Foundry scripts that can be tested and verified outside the Chaos Cloud.

The Chaos Simulation Components:

### Agents:
Agents can interface with the target chain as any EOA would, simulating users or bots interacting with the protocol.

### Scenarios:
Scenarios are used to alter the state of the Blockchain either on setup before the simulation starts or during the simulation to make changes like controlling oracle prices and executing spells.

### Observers:
The Chaos Cloud uses observers to collect metrics during the simulation execution. The data layer will process these metrics into configurable charts and statistical analysis.

### Assertions:
Assertions are used as tests and can be used to verify certain conditions of the protocol or Blockchain state hold throughout the simulation.

### Modules:
Modules are used to share libraries, code, and state with the different scripts and actors in the simulation.

### Contracts:
Smart Contracts to be used by agents and scenarios in the simulation.

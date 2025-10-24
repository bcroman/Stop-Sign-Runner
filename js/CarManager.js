// Class: Manages car spawning and difficulty settings
class CarManager {
    // Constructor: Initializes car manager with default settings
    constructor() {
        // Set of difficulty settings values
        this.difficultySettings = {
            easy: { carSpeed: -7, spawnRate: 3000 },
            medium: { carSpeed: -9, spawnRate: 2600 },
            hard: { carSpeed: -11, spawnRate: 2000 },
            difficult: { carSpeed: -13, spawnRate: 1400 },
            impossible: { carSpeed: -15, spawnRate: 1200 }
        };

        this.difficulty = "easy"; // default difficulty

        // safe lookup with fallback
        const cfg = this.difficultySettings[this.difficulty] || Object.values(this.difficultySettings)[0];
        this.carSpeed = cfg.carSpeed;
        this.spawnRate = cfg.spawnRate;

        this.spawnInterval = null;

        this.updateDifficultyDisplay(); // update UI
    }

    // Function: Spawns a car with the current speed setting
    spawnCar() {
        const Car = defineNewDynamic(1.0, 0.2, 0.8, 750, 540, 70, 35, "car");
        Car.GetBody().SetLinearVelocity(new b2Vec2(this.carSpeed, 0));
        return Car;
    }

    // Function: Starts the car spawner with the current spawn rate
    startSpawner() {
        this.stopSpawner();
        this.spawnInterval = setInterval(() => this.spawnCar(), this.spawnRate);
    }

    // Function: Stops the car spawner
    stopSpawner() {
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }
    }

    // Function: Sets the difficulty level and updates settings
    setDifficulty(newDifficulty) {
        if (!this.difficultySettings[newDifficulty]) return;
        this.difficulty = newDifficulty;
        this.carSpeed = this.difficultySettings[newDifficulty].carSpeed;
        this.spawnRate = this.difficultySettings[newDifficulty].spawnRate;
        // restart to apply new rate
        this.startSpawner();
        // log and update UI
        console.log("Difficulty changed to:", this.difficulty);
        this.updateDifficultyDisplay();
    }

    // Function: Updates difficulty based on score values
    updateDifficultyByScore(score) {
        let newDifficulty = "easy";
        if (score >= 150) newDifficulty = "impossible";
        else if (score >= 100) newDifficulty = "difficult";
        else if (score >= 70) newDifficulty = "hard";
        else if (score >= 30) newDifficulty = "medium";

        // Change difficulty if it has changed
        if (newDifficulty !== this.difficulty) {
            this.setDifficulty(newDifficulty);
        }
    }

    // Function: Updates the difficulty display in the UI
    updateDifficultyDisplay() {
        const el = document.getElementById("difficultyDisplay");
        if (!el) return;
        el.textContent = "Difficulty: " + this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
    }
}
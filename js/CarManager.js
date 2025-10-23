class CarManager {
    constructor() {
        // difficulty mapping must exist before we read from it
        this.difficultySettings = {
            easy: { carSpeed: -7, spawnRate: 3000 },
            medium: { carSpeed: -9, spawnRate: 2600 },
            hard: { carSpeed: -11, spawnRate: 2000 },
            difficult: { carSpeed: -13, spawnRate: 1400 },
            impossible: { carSpeed: -15, spawnRate: 1200 }
        };

        this.difficulty = "easy";

        // safe lookup with fallback
        const cfg = this.difficultySettings[this.difficulty] || Object.values(this.difficultySettings)[0];
        this.carSpeed = cfg.carSpeed;
        this.spawnRate = cfg.spawnRate;

        this.spawnInterval = null;

        this.updateDifficultyDisplay();
    }

    spawnCar() {
        const Car = defineNewDynamic(1.0, 0.2, 0.8, 750, 540, 70, 35, "car");
        Car.GetBody().SetLinearVelocity(new b2Vec2(this.carSpeed, 0));
        return Car;
    }

    startSpawner() {
        this.stopSpawner();
        this.spawnInterval = setInterval(() => this.spawnCar(), this.spawnRate);
    }

    stopSpawner() {
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }
    }

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

    updateDifficultyByScore(score) {
        let newDifficulty = "easy";
        if (score >= 150) newDifficulty = "impossible";
        else if (score >= 100) newDifficulty = "difficult";
        else if (score >= 70) newDifficulty = "hard";
        else if (score >= 30) newDifficulty = "medium";

        if (newDifficulty !== this.difficulty) {
            this.setDifficulty(newDifficulty);
        }
    }

    updateDifficultyDisplay() {
        const el = document.getElementById("difficultyDisplay");
        if (!el) return;
        el.textContent = "Difficulty: " + this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
    }
}
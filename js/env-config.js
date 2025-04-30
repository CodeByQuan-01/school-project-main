// This script loads environment variables from .env file
// and makes them available globally

class EnvConfig {
  constructor() {
    this.variables = {};
    this.loaded = false;
  }

  async load() {
    if (this.loaded) return this.variables;

    try {
      const response = await fetch("/.env");
      const text = await response.text();

      // Parse the .env file
      const lines = text.split("\n");
      for (const line of lines) {
        // Skip comments and empty lines
        if (line.startsWith("#") || !line.trim()) continue;

        // Parse key=value pairs
        const [key, value] = line.split("=");
        if (key && value) {
          this.variables[key.trim()] = value.trim();
        }
      }

      this.loaded = true;
      console.log("Environment variables loaded successfully");
      return this.variables;
    } catch (error) {
      console.error("Failed to load environment variables:", error);
      return {};
    }
  }

  async get(key) {
    if (!this.loaded) await this.load();
    return this.variables[key];
  }

  async getAll() {
    if (!this.loaded) await this.load();
    return this.variables;
  }
}

// Create a global instance
window.envConfig = new EnvConfig();

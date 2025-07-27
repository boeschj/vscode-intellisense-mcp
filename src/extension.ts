// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as net from "net";
import * as vscode from "vscode";

let server: net.Server | null = null;

function startTcpServer(): number {
  const port = 57142;
  server = net.createServer((socket) => {
    console.log("🛡️ Client connected");

    socket.on("data", (data) => {
      const payload = data.toString().trim();
      console.log("🛡️ Raw data received:", payload);
      
      try {
        const jsonPayload = JSON.parse(payload);
        console.log("🛡️ Hook payload received:");
        console.log(JSON.stringify(jsonPayload, null, 2));
      } catch (error) {
        console.log("🛡️ Data is not JSON, treating as plain text");
      }
      
      socket.write("received\n");
    });

    socket.on("end", () => {
      console.log("🛡️ Client disconnected");
    });
  });

  server.listen(port, "localhost", () => {
    console.log(`🛡️ TCP server listening on port ${port}`);
  });

  return port;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log("🛡️ Guardrail extension activated!");

  const port = startTcpServer();
  console.log(`🛡️ TCP server started on port ${port}`);

  const config = vscode.workspace.getConfiguration();

  const platform =
    process.platform === "darwin"
      ? "osx"
      : process.platform === "win32"
      ? "windows"
      : "linux";

  const existingEnv = config.get(`terminal.integrated.env.${platform}`, {});

  const newEnv = {
    ...existingEnv,
    GUARDRAIL_PORT: port.toString(),
  };

  config.update(
    `terminal.integrated.env.${platform}`,
    newEnv,
    vscode.ConfigurationTarget.Workspace
  );

  console.log("🛡️ Environment variables configured for new terminals");

  context.subscriptions.push({
    dispose: () => {
      if (server) {
        console.log("🛡️ Shutting down TCP server");
        server.close();
      }
    },
  });
}

// This method is called when your extension is deactivated
export function deactivate() {
  if (server) {
    server.close();
  }
}

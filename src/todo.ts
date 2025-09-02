#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import notifier from "node-notifier";
import * as chrono from "chrono-node";
import * as readline from "readline";

// Define Task type
interface Task {
  text: string;
  reminderTime?: string; // stored as ISO
}

const filePath = path.join(process.cwd(), "tasks.json");

// Read tasks
const readTasks = (): Task[] => {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
};

// Save tasks
const saveTasks = (tasks: Task[]): void => {
  fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2));
};

// Parse reminder (supports natural language or ISO)
const parseReminder = (input?: string): string | undefined => {
  if (!input) return undefined;

  const parsed = chrono.parseDate(input);
  if (parsed) {
    return parsed.toISOString();
  }

  const isoDate = new Date(input);
  if (!isNaN(isoDate.getTime())) {
    return isoDate.toISOString();
  }

  console.log(`⚠️ Could not parse reminder time: "${input}"`);
  return undefined;
};

// Add a task
const addTask = (taskText: string, reminderInput?: string): void => {
  const tasks = readTasks();
  const reminderTime = parseReminder(reminderInput);

  const newTask: Task = { text: taskText };
  if (reminderTime) {
    newTask.reminderTime = reminderTime;
    scheduleReminder(newTask);
  }

  tasks.push(newTask);
  saveTasks(tasks);

  console.log(`✅ Task "${taskText}" added!`);
  if (reminderTime) {
    console.log(`⏰ Reminder set for ${new Date(reminderTime).toLocaleString()}`);
  }
};

// List tasks
const listTasks = (): void => {
  const tasks = readTasks();
  if (tasks.length === 0) {
    console.log("No tasks available.");
    return;
  }
  console.log("📋 Your tasks:");
  tasks.forEach((task, index) => {
    const reminder = task.reminderTime
      ? ` (Reminder: ${new Date(task.reminderTime).toLocaleString()})`
      : "";
    console.log(`${index + 1}. ${task.text}${reminder}`);
  });
};

// Remove task
const removeTask = (index: number): void => {
  const tasks = readTasks();
  if (index < 1 || index > tasks.length) {
    console.log("Invalid task index!");
    return;
  }
  const removedTask = tasks.splice(index - 1, 1);
  saveTasks(tasks);
  console.log(`🗑️ Task "${removedTask[0].text}" removed!`);
};

// Schedule reminder
const scheduleReminder = (task: Task) => {
  if (!task.reminderTime) return;

  const reminderDate = new Date(task.reminderTime).getTime();
  const now = Date.now();
  const delay = reminderDate - now;

  if (delay > 0) {
    setTimeout(() => {
      console.log(`\n⏰ Reminder: "${task.text}"`);

      notifier.notify({
        title: "Todo Reminder",
        message: task.text,
        sound: true,
        wait: false,
      });

      process.stdout.write("todo> "); // keep prompt on screen
    }, delay);
  }
};

// Reschedule all reminders at startup
const rescheduleAllReminders = () => {
  const tasks = readTasks();
  tasks.forEach(scheduleReminder);
};

// Interactive CLI
const interactiveCLI = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "todo> ",
  });

  console.log("📌 Todo CLI started (type 'help' for commands)");
  rl.prompt();

  rl.on("line", (line) => {
    const args = line.trim().split(" ");
    const command = args[0];

    if (command === "add" && args[1]) {
      const taskText = args[1];
      const reminderInput = args.slice(2).join(" ");
      addTask(taskText, reminderInput);
    } else if (command === "list") {
      listTasks();
    } else if (command === "remove" && args[1]) {
      const index = parseInt(args[1], 10);
      removeTask(index);
    } else if (command === "help") {
      console.log("Commands:");
      console.log("  add <task> [reminderTime]   Add a task with optional reminder");
      console.log("  list                        List all tasks");
      console.log("  remove <index>              Remove a task");
      console.log("  exit                        Quit the app");
    } else if (command === "exit" || command === "quit") {
      console.log("👋 Exiting todo app...");
      rl.close();
      process.exit(0);
    } else {
      console.log("Unknown command. Type 'help' for usage.");
    }

    rl.prompt();
  });
};

// CLI Entrypoint
const cli = () => {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // no args → enter interactive mode
    interactiveCLI();
    return;
  }

  // one-shot mode
  const command = args[0];
  if (command === "add" && args[1]) {
    const taskText = args[1];
    const reminderInput = args.slice(2).join(" ");
    addTask(taskText, reminderInput);
  } else if (command === "list") {
    listTasks();
  } else if (command === "remove" && args[1]) {
    const index = parseInt(args[1], 10);
    removeTask(index);
  } else {
    console.log("Usage:");
    console.log("  npx ts-node src/todo.ts add <task> [reminderTime]");
    console.log("  npx ts-node src/todo.ts list");
    console.log("  npx ts-node src/todo.ts remove <index>");
    console.log("  npx ts-node src/todo.ts            # interactive mode");
  }
};

// Start
rescheduleAllReminders();
cli();

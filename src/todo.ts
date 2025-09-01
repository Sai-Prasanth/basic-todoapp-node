import * as fs from 'fs';
import * as path from 'path';

// Use the current working directory for storing tasks.json
const filePath = path.join(process.cwd(), 'tasks.json');

// Helper function to read tasks from the JSON file
const readTasks = (): string[] => {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
};

// Helper function to save tasks to the JSON file
const saveTasks = (tasks: string[]): void => {
  fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2));
};

// Command to add a new task
const addTask = (task: string): void => {
  const tasks = readTasks();
  tasks.push(task);
  saveTasks(tasks);
  console.log(`Task "${task}" added!`);
};

// Command to list all tasks
const listTasks = (): void => {
  const tasks = readTasks();
  if (tasks.length === 0) {
    console.log('No tasks available.');
    return;
  }
  console.log('Your tasks:');
  tasks.forEach((task, index) => {
    console.log(`${index + 1}. ${task}`);
  });
};

// Command to remove a task by its index
const removeTask = (index: number): void => {
  const tasks = readTasks();
  if (index < 1 || index > tasks.length) {
    console.log('Invalid task index!');
    return;
  }
  const removedTask = tasks.splice(index - 1, 1);
  saveTasks(tasks);
  console.log(`Task "${removedTask[0]}" removed!`);
};

// CLI function to handle commands
const cli = () => {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'add' && args[1]) {
    addTask(args[1]);
  } else if (command === 'list') {
    listTasks();
  } else if (command === 'remove' && args[1]) {
    const index = parseInt(args[1], 10);
    removeTask(index);
  } else {
    console.log('Usage:');
    console.log('  npx ts-node src/todo.ts add <task>       Add a new task');
    console.log('  npx ts-node src/todo.ts list             List all tasks');
    console.log('  npx ts-node src/todo.ts remove <index>   Remove a task by its index');
  }
};

cli();

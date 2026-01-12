/**
 * Home Page
 * 
 * The main entry point of the application.
 * Simply renders the TaskAgent component which handles all the logic.
 * 
 * Why so simple? Following the principle of separation of concerns:
 * - Page components handle routing and layout
 * - Feature components (TaskAgent) handle business logic
 * - UI components (TaskUI, InputArea) handle presentation
 */

import { TaskAgent } from '@/components/TaskAgent';

export default function Home() {
    return <TaskAgent />;
}

/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AgentArena from './pages/AgentArena';
import AgentProfile from './pages/AgentProfile';
import Agents from './pages/Agents';
import CharacterProfile from './pages/CharacterProfile';
import Characters from './pages/Characters';
import Combat from './pages/Combat';
import Crafting from './pages/Crafting';
import Economy from './pages/Economy';
import Experimentation from './pages/Experimentation';
import GMDashboard from './pages/GMDashboard';
import Governance from './pages/Governance';
import Guilds from './pages/Guilds';
import Home from './pages/Home';
import Housing from './pages/Housing';
import Jobs from './pages/Jobs';
import Recording from './pages/Recording';
import World from './pages/World';
import WorldEvents from './pages/WorldEvents';
import WorldMapView from './pages/WorldMapView';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AgentArena": AgentArena,
    "AgentProfile": AgentProfile,
    "Agents": Agents,
    "CharacterProfile": CharacterProfile,
    "Characters": Characters,
    "Combat": Combat,
    "Crafting": Crafting,
    "Economy": Economy,
    "Experimentation": Experimentation,
    "GMDashboard": GMDashboard,
    "Governance": Governance,
    "Guilds": Guilds,
    "Home": Home,
    "Housing": Housing,
    "Jobs": Jobs,
    "Recording": Recording,
    "World": World,
    "WorldEvents": WorldEvents,
    "WorldMapView": WorldMapView,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
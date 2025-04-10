"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Dashboard = () => {
    return (<div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Communication Dashboard</h1>
          </div>
          <div className="mb-4">
            {/* Add your communication dashboard content here */}
          </div>
        </div>
      </div>
    </div>);
};
exports.default = Dashboard;

"use client";
import { useState } from "react";
import { todoService } from "../services/todoService";
import FormInput from "./FormInput";
import Button from "./Button";
import { useAuth } from "../hooks/useAuth";

export default function TodoForm({ onSuccess, isModal = false }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    status: "pending",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      return "标题不能为空";
    }
    if (formData.title.length > 100) {
      return "标题不能超过100个字符";
    }
    if (formData.description && formData.description.length > 500) {
      return "描述不能超过500个字符";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await todoService.createTodo({
        ...formData,
        userId: user?.$id,
      });
      setFormData({
        title: "",
        description: "",
        dueDate: "",
        priority: "medium",
        status: "pending",
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 悬浮窗模式的内容
  if (isModal) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-base">
            {error}
          </div>
        )}

        <FormInput
          label="标题"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="输入待办事项标题"
          required
          className="text-base"
        />

        <FormInput
          label="描述"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="输入待办事项描述（可选）"
          className="text-base"
        />

        <div className="space-y-4">
          <FormInput
            label="截止日期（可选）"
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleInputChange}
            className="text-base"
          />

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              优先级
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-base"
            >
              <option value="low">🌱 低优先级</option>
              <option value="medium">⭐ 中优先级</option>
              <option value="high">🔥 高优先级</option>
            </select>
          </div>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="w-full py-4 text-lg font-semibold rounded-xl"
            size="lg"
          >
            {isSubmitting ? "创建中..." : "✨ 创建待办事项"}
          </Button>
        </div>
      </form>
    );
  }

  // 原始模式的内容（保留兼容性）
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mx-4 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">添加新待办</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-base">
            {error}
          </div>
        )}

        <FormInput
          label="标题"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="输入待办事项标题"
          required
          className="text-base"
        />

        <FormInput
          label="描述"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="输入待办事项描述（可选）"
          className="text-base"
        />

        <div className="space-y-4">
          <FormInput
            label="截止日期（可选）"
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleInputChange}
            className="text-base"
          />

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              优先级
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-base"
            >
              <option value="low">🌱 低优先级</option>
              <option value="medium">⭐ 中优先级</option>
              <option value="high">🔥 高优先级</option>
            </select>
          </div>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="w-full py-4 text-lg font-semibold rounded-xl"
            size="lg"
          >
            {isSubmitting ? "创建中..." : "✨ 创建待办事项"}
          </Button>
        </div>
      </form>
    </div>
  );
} 
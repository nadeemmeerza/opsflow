"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useNotification } from "@/components/notifications/NotificationContext";
import { getApiErrorMessage } from "@/store/api/apiSlice";

import { useUpdateTaskMutation, type Task } from "./tasksApi";

import { useGetOrganizationMembersQuery } from "../organizations/organizationsApi";

import styles from "./EditTaskForm.module.scss";

const editTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title cannot exceed 200 characters"),

  description: z
    .string()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional(),

  assigneeId: z.string().optional(),

  status: z.enum(["todo", "in_progress", "review", "done"]),

  priority: z.enum(["low", "medium", "high", "urgent"]),

  dueDate: z.string().optional(),
});

type EditTaskFormValues = z.infer<typeof editTaskSchema>;

interface EditTaskFormProps {
  organizationId: string;
  projectId: string;
  task: Task;
}

export default function EditTaskForm({
  organizationId,
  projectId,
  task,
}: EditTaskFormProps) {
  const router = useRouter();

  const { success, error: showError } = useNotification();

  // Stores backend validation/API errors so they are
  // visible inside the form as well as in the toast.
  const [apiError, setApiError] = useState<string[]>([]);

  const [updateTask, { isLoading }] = useUpdateTaskMutation();

  const {
  data: membersResponse,
  isLoading: membersLoading,
} = useGetOrganizationMembersQuery({
  organizationId,
  query: {
    page: 1,
    limit: 10,
  },
});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditTaskFormValues>({
    resolver: zodResolver(editTaskSchema),
  });

  useEffect(() => {
    let assigneeId = "";

    if (task.assigneeId && typeof task.assigneeId === "object") {
      assigneeId = task.assigneeId._id;
    } else if (typeof task.assigneeId === "string") {
      assigneeId = task.assigneeId;
    }

    reset({
      title: task.title,
      description: task.description || "",
      assigneeId,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });

    // Clear stale API errors when a different task
    // is loaded into the form.
    setApiError([]);
  }, [task, reset]);

  const onSubmit = async (values: EditTaskFormValues) => {
    // Remove errors from the previous submission.
    setApiError([]);

    try {
      await updateTask({
        organizationId,
        projectId,
        taskId: task._id,
        data: {
          title: values.title,
          description: values.description || undefined,
          assigneeId: values.assigneeId || undefined,
          status: values.status,
          priority: values.priority,
          dueDate: values.dueDate || undefined,
        },
      }).unwrap();

      success("Task updated successfully.");

      router.push(
        `/organizations/${organizationId}/projects/${projectId}/tasks/${task._id}`,
      );
    } catch (error) {
      const messages = getApiErrorMessage(error);

      console.error("Failed to update task:", error);

      // Show all backend validation errors inside
      // the form and the first one as a toast.
      setApiError(messages);

      showError(messages[0] ?? "Failed to update task.");
    }
  };

  const members = membersResponse?.data.items ?? [];

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      {apiError.length > 0 && (
        <div className={styles.error}>
          {apiError.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="title">Task title</label>

        <input id="title" type="text" {...register("title")} />

        {errors.title && <p className={styles.error}>{errors.title.message}</p>}
      </div>

      <div className={styles.field}>
        <label htmlFor="description">Description</label>

        <textarea id="description" rows={7} {...register("description")} />

        {errors.description && (
          <p className={styles.error}>{errors.description.message}</p>
        )}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="status">Status</label>

          <select id="status" {...register("status")}>
            <option value="todo">To Do</option>

            <option value="in_progress">In Progress</option>

            <option value="review">Review</option>

            <option value="done">Done</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="priority">Priority</label>

          <select id="priority" {...register("priority")}>
            <option value="low">Low</option>

            <option value="medium">Medium</option>

            <option value="high">High</option>

            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="assigneeId">Assignee</label>

          <select
            id="assigneeId"
            {...register("assigneeId")}
            disabled={membersLoading}
          >
            <option value="">Unassigned</option>

            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.user?.name ?? member.userId}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="dueDate">Due date</label>

          <input id="dueDate" type="date" {...register("dueDate")} />
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </button>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

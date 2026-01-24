interface GroupFormProps {
    initialData?: {
        name: string;
    };
    onSubmit: (data: {
        name: string;
    }) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
    submitLabel: string;
}
export declare function GroupForm({ initialData, onSubmit, onCancel, isSubmitting, submitLabel }: GroupFormProps): import("react/jsx-runtime").JSX.Element;
export {};

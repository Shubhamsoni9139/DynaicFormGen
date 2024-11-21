import React, { useState, useEffect } from "react";

// TypeScript interfaces
interface FieldOption {
  value: string;
  label: string;
}

interface FormField {
  id: string;
  type: "text" | "email" | "select" | "radio" | "textarea";
  label: string;
  required: boolean;
  placeholder?: string;
  validation?: {
    pattern: string;
    message: string;
  };
  options?: FieldOption[];
}

interface FormSchema {
  formTitle: string;
  formDescription: string;
  fields: FormField[];
}

interface FormErrors {
  [key: string]: string;
}

const defaultSchema: FormSchema = {
  formTitle: "New Form",
  formDescription: "Please fill out this form",
  fields: [],
};

const DynamicFormGenerator = () => {
  const [jsonSchema, setJsonSchema] = useState<string>("");
  const [parsedSchema, setParsedSchema] = useState<FormSchema>(defaultSchema);
  const [jsonError, setJsonError] = useState<string>("");
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Initialize form data whenever schema changes
  useEffect(() => {
    const initialData = parsedSchema.fields.reduce((acc, field) => {
      acc[field.id] = "";
      return acc;
    }, {} as { [key: string]: string });
    setFormData(initialData);
  }, [parsedSchema]);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

  const validateField = (field: FormField, value: string): string => {
    if (field.required && !value) {
      return "This field is required";
    }
    if (field.validation?.pattern && value) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        return field.validation.message;
      }
    }
    return "";
  };

  const handleJsonChange = (value: string) => {
    setJsonSchema(value);
    try {
      const parsed = JSON.parse(value);

      // Validate fields property
      if (!parsed.fields || !Array.isArray(parsed.fields)) {
        throw new Error(
          `Missing or invalid "fields". Example:\n"fields": [\n  {\n    "id": "name",\n    "type": "text",\n    "label": "Name",\n    "required": true\n  }\n]`
        );
      }

      // Check if all entries in the `fields` array are valid objects
      const invalidFields = parsed.fields.filter(
        (field: FormField) =>
          typeof field !== "object" || Array.isArray(field) || !field.id
      );

      if (invalidFields.length > 0) {
        throw new Error(
          `Invalid field detected:\n${JSON.stringify(
            invalidFields[0],
            null,
            2
          )}\nExample of a valid field:\n{\n  "id": "name",\n  "type": "text",\n  "label": "Name",\n  "required": true\n}`
        );
      }

      // Validate formDescription property
      if (
        !parsed.formDescription ||
        typeof parsed.formDescription !== "string"
      ) {
        throw new Error(
          `Missing or invalid "formDescription". Example:\n"formDescription": "Please fill out this form to help us gather your feedback",`
        );
      }

      // Validate formTitle property
      if (!parsed.formTitle || typeof parsed.formTitle !== "string") {
        throw new Error(
          `Missing or invalid "formTitle". Example:\n"formTitle": "Project Requirements Survey",`
        );
      }

      // If all validations pass, update the parsed schema
      setParsedSchema(parsed);
      setJsonError("");
    } catch (e) {
      if (e instanceof SyntaxError) {
        setJsonError(
          `Invalid JSON format. Please fix the syntax errors.\nExample:\n{
    "formTitle": "Project Requirements Survey",
    "formDescription": "Please fill out this form to help us gather your feedback",
    "fields": [
      {
        "id": "name",
        "type": "text",
        "label": "Name",
        "required": true
      }
    ]
  }`
        );
      } else {
        // Show specific error messages for missing keys or invalid fields
        if (e instanceof Error) {
          setJsonError(e.message);
        } else {
          setJsonError("An unknown error occurred");
        }
      }

      // Revert to the default schema
      setParsedSchema(defaultSchema);
    }
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    const field = parsedSchema.fields.find((f) => f.id === fieldId);
    if (field) {
      const error = validateField(field, value);
      setFormErrors((prev) => ({
        ...prev,
        [fieldId]: error,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate all fields
    const newErrors: FormErrors = {};
    let hasErrors = false;

    parsedSchema.fields.forEach((field) => {
      const error = validateField(field, formData[field.id]);
      if (error) {
        newErrors[field.id] = error;
        hasErrors = true;
      }
    });

    setFormErrors(newErrors);

    if (!hasErrors) {
      try {
        console.log("Form submission:", formData);
        setSubmitSuccess(true);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case "select":
        return (
          <select
            id={field.id}
            value={formData[field.id] || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`${field.id}-${option.value}`}
                  name={field.id}
                  value={option.value}
                  checked={formData[field.id] === option.value}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="mr-2"
                />
                <label htmlFor={`${field.id}-${option.value}`}>
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case "textarea":
        return (
          <textarea
            id={field.id}
            value={formData[field.id] || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full p-2 border rounded-md"
            rows={4}
          />
        );

      default:
        return (
          <input
            type={field.type}
            id={field.id}
            value={formData[field.id] || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full p-2 border rounded-md"
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* JSON Editor */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">JSON Schema Editor</h2>
            <textarea
              className={`w-full h-96 font-mono p-4 border rounded-lg ${
                jsonError ? "border-red-500" : "border-gray-200"
              }`}
              value={jsonSchema}
              onChange={(e) => handleJsonChange(e.target.value)}
              placeholder="Paste your JSON schema here..."
            />
            {jsonError && (
              <p className="text-red-500 mt-2 whitespace-pre-line">
                {jsonError}
              </p>
            )}
          </div>

          {/* Form Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold">{parsedSchema.formTitle}</h2>
              <p className="text-gray-600 mb-6">
                {parsedSchema.formDescription}
              </p>

              {parsedSchema.fields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <label htmlFor={field.id} className="block font-medium">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {renderField(field)}
                  {formErrors[field.id] && (
                    <p className="text-red-500 text-sm">
                      {formErrors[field.id]}
                    </p>
                  )}
                </div>
              ))}

              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
              {submitSuccess && (
                <p className="text-green-500 text-sm mt-2">
                  Form submitted successfully!
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicFormGenerator;

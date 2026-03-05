import React, { useMemo, useRef } from "react";
import { useField, useFormikContext } from "formik";
import FieldWrapper from "./FieldWrapper";

export default function ImagePicker({
  name,
  label = "Image",
  maxSizeMB = 5,
  existingUrl = null,
  placeholder = "Click to upload image",
}) {
  const [field, , helpers] = useField(name);
  const { setFieldError } = useFormikContext();
  const inputRef = useRef(null);

  const previewUrl = useMemo(() => {
    if (field.value instanceof File) return URL.createObjectURL(field.value);
    return existingUrl || null;
  }, [field.value, existingUrl]);

  const handleChange = (e) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return helpers.setValue(null);
    if (!file.type.startsWith("image/")) return setFieldError(name, "Only image files are allowed");
    if (file.size > maxSizeMB * 1024 * 1024) return setFieldError(name, `Image must be ≤ ${maxSizeMB}MB`);
    helpers.setValue(file);
  };

  return (
    <FieldWrapper name={name} label={label}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden-file-input"
        onChange={handleChange}
      />
      <div className="image-preview" onClick={() => inputRef.current?.click()}>
        {previewUrl ? (
          <img src={previewUrl} className="preview-img" alt="Preview" />
        ) : (
          <div className="preview-placeholder">{placeholder}</div>
        )}
      </div>
    </FieldWrapper>
  );
}
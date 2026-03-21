import SharedInfoForm from './SharedInfoForm';

export default function Step2TeacherInfo({ formData, onChange, onNext, onBack }) {
    return (
        <SharedInfoForm
            formData={formData} onChange={onChange}
            onPrimary={onNext} primaryLabel="Tiếp theo"
            onBack={onBack} showGrade={false} loading={false}
        />
    );
}
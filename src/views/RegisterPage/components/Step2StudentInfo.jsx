import SharedInfoForm from './SharedInfoForm';

export default function Step2StudentInfo({ formData, onChange, onFinish, onBack, loading }) {
    return (
        <SharedInfoForm
            formData={formData} onChange={onChange}
            onPrimary={onFinish} primaryLabel="Hoàn thành"
            onBack={onBack} showGrade={true} loading={loading}
        />
    );
}
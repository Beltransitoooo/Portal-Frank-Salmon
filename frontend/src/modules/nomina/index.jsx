import React from 'react';
import ComingSoon from '../../components/ComingSoon';
import { IconPayroll } from '../Icons';

export default function Nomina({ onBack }) {
  return (
    <ComingSoon
      icon={IconPayroll}
      title="Nómina"
      message="Estamos afinando cada detalle para que los pagos salgan siempre puntuales y claros."
      onBack={onBack}
    />
  );
}
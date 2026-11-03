import React from 'react';
import ComingSoon from '../../components/ComingSoon';
import { IconMenuBook } from '../Icons';

export default function Menu({ onBack }) {
  return (
    <ComingSoon
      icon={IconMenuBook}
      title="Menú"
      message="Estamos dando los últimos toques al menú para que luzca tan bien como sabe."
      onBack={onBack}
    />
  );
}
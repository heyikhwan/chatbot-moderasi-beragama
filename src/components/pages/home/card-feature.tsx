const CardFeature = ({
    title,
    description,
    Icon,
}: {
    title: string
    description: string
    Icon: React.ElementType
}) => {
    return (
        <div className="rounded-lg border bg-card p-5">
            <div className="flex items-start gap-3">
                <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-md bg-accent">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="space-y-1.5">
                    <h3 className="text-base font-semibold">{title}</h3>
                    <p className="text-muted-foreground text-sm">{description}</p>
                </div>
            </div>
        </div>
    )
}

export default CardFeature
